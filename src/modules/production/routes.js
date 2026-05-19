const express = require('express');
const router = express.Router();
const prisma = require('../../shared/db/prisma');
const { generateTransactionNo, parsePagination, paginatedResponse } = require('../../shared/utils/helpers');
const { createJournal, postJournal } = require('../../shared/journal/journalEngine');
const { authenticate } = require('../../shared/middleware/auth');
const { validate, rules } = require('../../shared/utils/validate');

const { required, string, number, integer, min, boolean, minLen, maxLen, array, minItems } = rules;

router.use(authenticate);

// ============================================
// BILL OF MATERIALS
// ============================================

router.get('/boms', async (req, res) => {
  try {
    const { search, active, finishedGoodId } = req.query;
    const { skip, take, page, limit } = parsePagination(req.query);
    const where = {};
    if (active !== undefined) where.active = active === 'true';
    if (finishedGoodId) where.finishedGoodId = finishedGoodId;
    if (search) {
      where.OR = [
        { bomCode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { finishedGood: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }
    const [boms, total] = await Promise.all([
      prisma.bOM.findMany({
        where,
        include: {
          finishedGood: { select: { sku: true, name: true, uom: true } },
          lines: { include: { material: { select: { sku: true, name: true, uom: true, stock: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.bOM.count({ where }),
    ]);
    res.json(paginatedResponse(boms, total, page, limit));
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.get('/boms/:id', async (req, res) => {
  try {
    const bom = await prisma.bOM.findUnique({
      where: { id: req.params.id },
      include: {
        finishedGood: { select: { sku: true, name: true, uom: true, stock: true } },
        lines: { include: { material: { select: { sku: true, name: true, uom: true, stock: true, purchasePrice: true } } } },
      },
    });
    if (!bom) return res.status(404).json({ status: 'error', message: 'BOM not found' });
    res.json({ status: 'ok', data: bom });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.post(
  '/boms',
  validate({
    finishedGoodId: [required, string],
    description: [string, maxLen(300)],
    lines: [required, array, minItems(1)],
    'lines.*.materialId': [required, string],
    'lines.*.quantityPerUnit': [required, number, min(0.0001)],
    'lines.*.uom': [string],
  }),
  async (req, res) => {
    try {
      const { finishedGoodId, description, lines } = req.body;

      const fg = await prisma.item.findUnique({ where: { id: finishedGoodId } });
      if (!fg) return res.status(404).json({ status: 'error', message: 'Finished good item not found' });
      if (fg.itemType !== 'finished_good') {
        return res.status(400).json({ status: 'error', message: 'Item must have itemType = finished_good' });
      }

      // Deactivate previous active BOM for this FG
      await prisma.bOM.updateMany({
        where: { finishedGoodId, active: true },
        data: { active: false },
      });

      const bomCode = generateTransactionNo('BOM');
      const bom = await prisma.bOM.create({
        data: {
          bomCode,
          finishedGoodId,
          description,
          active: true,
          lines: {
            create: lines.map((l) => ({
              materialId: l.materialId,
              quantityPerUnit: l.quantityPerUnit,
              uom: l.uom,
            })),
          },
        },
        include: {
          finishedGood: { select: { sku: true, name: true, uom: true } },
          lines: { include: { material: { select: { sku: true, name: true, uom: true } } } },
        },
      });
      res.status(201).json({ status: 'ok', data: bom });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }
);

router.put(
  '/boms/:id',
  validate({
    description: [string, maxLen(300)],
    active: [boolean],
    lines: [array, minItems(1)],
    'lines.*.materialId': [required, string],
    'lines.*.quantityPerUnit': [required, number, min(0.0001)],
    'lines.*.uom': [string],
  }),
  async (req, res) => {
    try {
      const { description, active, lines } = req.body;
      const existing = await prisma.bOM.findUnique({ where: { id: req.params.id } });
      if (!existing) return res.status(404).json({ status: 'error', message: 'BOM not found' });

      const updateData = {};
      if (description !== undefined) updateData.description = description;
      if (active !== undefined) updateData.active = active;

      if (lines) {
        await prisma.bOMLine.deleteMany({ where: { bomId: req.params.id } });
        updateData.lines = {
          create: lines.map((l) => ({
            materialId: l.materialId,
            quantityPerUnit: l.quantityPerUnit,
            uom: l.uom,
          })),
        };
      }

      const bom = await prisma.bOM.update({
        where: { id: req.params.id },
        data: updateData,
        include: {
          finishedGood: { select: { sku: true, name: true, uom: true } },
          lines: { include: { material: { select: { sku: true, name: true, uom: true } } } },
        },
      });
      res.json({ status: 'ok', data: bom });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }
);

router.delete('/boms/:id', async (req, res) => {
  try {
    await prisma.bOM.update({ where: { id: req.params.id }, data: { active: false } });
    res.json({ status: 'ok', message: 'BOM deactivated' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ status: 'error', message: 'BOM not found' });
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================
// JOB ORDERS
// ============================================

router.get('/job-orders', async (req, res) => {
  try {
    const { status, salesInvoiceId, finishedGoodId } = req.query;
    const { skip, take, page, limit } = parsePagination(req.query);
    const where = {};
    if (status) where.status = status;
    if (salesInvoiceId) where.salesInvoiceId = salesInvoiceId;
    if (finishedGoodId) where.finishedGoodId = finishedGoodId;
    const [jobOrders, total] = await Promise.all([
      prisma.jobOrder.findMany({
        where,
        include: {
          finishedGood: { select: { sku: true, name: true, uom: true } },
          salesInvoice: { select: { invoiceNo: true, customer: { select: { name: true } } } },
          materials: { include: { material: { select: { sku: true, name: true, uom: true, stock: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.jobOrder.count({ where }),
    ]);
    res.json(paginatedResponse(jobOrders, total, page, limit));
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.get('/job-orders/:id', async (req, res) => {
  try {
    const jobOrder = await prisma.jobOrder.findUnique({
      where: { id: req.params.id },
      include: {
        finishedGood: { select: { sku: true, name: true, uom: true, stock: true } },
        bom: { include: { lines: { include: { material: { select: { sku: true, name: true, uom: true } } } } } },
        salesInvoice: { select: { invoiceNo: true, status: true, customer: { select: { name: true } } } },
        salesInvoiceLine: true,
        materials: { include: { material: { select: { sku: true, name: true, uom: true, stock: true, purchasePrice: true } } } },
        journal: { include: { lines: { include: { account: { select: { code: true, name: true } } } } } },
      },
    });
    if (!jobOrder) return res.status(404).json({ status: 'error', message: 'Job order not found' });
    res.json({ status: 'ok', data: jobOrder });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Complete job order — deduct RM, add FG, journal
router.put('/job-orders/:id/complete', async (req, res) => {
  try {
    const jobOrder = await prisma.jobOrder.findUnique({
      where: { id: req.params.id },
      include: {
        materials: { include: { material: true } },
        finishedGood: true,
        bom: true,
      },
    });
    if (!jobOrder) return res.status(404).json({ status: 'error', message: 'Job order not found' });
    if (!['ready', 'waiting_material'].includes(jobOrder.status)) {
      return res.status(400).json({ status: 'error', message: `Cannot complete job order with status: ${jobOrder.status}` });
    }

    // Re-check stock availability
    const shortages = [];
    for (const mat of jobOrder.materials) {
      if (mat.material.stock < mat.requiredQty) {
        shortages.push(`${mat.material.name}: available ${mat.material.stock}, required ${mat.requiredQty}`);
      }
    }
    if (shortages.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Insufficient stock for materials',
        shortages,
      });
    }

    // Execute production
    await prisma.$transaction(async (tx) => {
      // Deduct each RM
      for (const mat of jobOrder.materials) {
        await tx.stockMovement.create({
          data: {
            itemId: mat.materialId,
            type: 'out',
            quantity: mat.requiredQty,
            reference: jobOrder.jobOrderNo,
            referenceType: 'production',
            notes: `RM consumed for job order ${jobOrder.jobOrderNo}`,
          },
        });
        await tx.item.update({
          where: { id: mat.materialId },
          data: { stock: { decrement: mat.requiredQty } },
        });
        await tx.jobOrderMaterial.update({
          where: { id: mat.id },
          data: { consumedQty: mat.requiredQty },
        });
      }

      // Add FG stock
      await tx.stockMovement.create({
        data: {
          itemId: jobOrder.finishedGoodId,
          type: 'in',
          quantity: jobOrder.plannedQty,
          reference: jobOrder.jobOrderNo,
          referenceType: 'production',
          notes: `FG produced from job order ${jobOrder.jobOrderNo}`,
        },
      });
      await tx.item.update({
        where: { id: jobOrder.finishedGoodId },
        data: { stock: { increment: jobOrder.plannedQty } },
      });

      // Update job order status
      await tx.jobOrder.update({
        where: { id: req.params.id },
        data: { status: 'completed', completedQty: jobOrder.plannedQty, completedDate: new Date() },
      });
    });

    // Journal: Debit FG Inventory (1300), Credit RM Inventory (1300)
    try {
      const rmCost = jobOrder.materials.reduce((sum, m) => sum + m.requiredQty * m.material.purchasePrice, 0);
      if (rmCost > 0) {
        const journal = await createJournal({
          date: new Date().toISOString(),
          description: `Production completed: ${jobOrder.jobOrderNo}`,
          type: 'auto',
          reference: jobOrder.jobOrderNo,
          referenceType: 'production',
          lines: [
            { accountCode: '1300', debit: rmCost, credit: 0, description: `FG inventory added: ${jobOrder.finishedGood.name}` },
            { accountCode: '1300', debit: 0, credit: rmCost, description: 'RM inventory consumed' },
          ],
        });
        await postJournal(journal.id);
        await prisma.jobOrder.update({
          where: { id: req.params.id },
          data: { journal: { connect: { id: journal.id } } },
        });
      }
    } catch (journalErr) {
      console.warn('Production journal skipped:', journalErr.message);
    }

    const updated = await prisma.jobOrder.findUnique({
      where: { id: req.params.id },
      include: {
        finishedGood: { select: { sku: true, name: true, uom: true, stock: true } },
        materials: { include: { material: { select: { sku: true, name: true, stock: true } } } },
      },
    });
    res.json({ status: 'ok', data: updated });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.put('/job-orders/:id/cancel', async (req, res) => {
  try {
    const jobOrder = await prisma.jobOrder.findUnique({ where: { id: req.params.id } });
    if (!jobOrder) return res.status(404).json({ status: 'error', message: 'Job order not found' });
    if (jobOrder.status === 'completed') {
      return res.status(400).json({ status: 'error', message: 'Completed job orders cannot be cancelled' });
    }
    const updated = await prisma.jobOrder.update({
      where: { id: req.params.id },
      data: { status: 'cancelled' },
    });
    res.json({ status: 'ok', data: updated });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================
// SHARED HELPER — called from purchasing after GRN
// ============================================

async function recheckWaitingJobOrders() {
  const waitingOrders = await prisma.jobOrder.findMany({
    where: { status: 'waiting_material' },
    include: { materials: { include: { material: true } } },
  });

  for (const jo of waitingOrders) {
    const allSufficient = jo.materials.every((m) => m.material.stock >= m.requiredQty);
    if (allSufficient) {
      await prisma.jobOrder.update({
        where: { id: jo.id },
        data: { status: 'ready' },
      });
    }
  }
}

module.exports = router;
module.exports.recheckWaitingJobOrders = recheckWaitingJobOrders;
