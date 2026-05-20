const express = require('express');
const router = express.Router();
const prisma = require('../../shared/db/prisma');
const { generateTransactionNo, parsePagination, paginatedResponse } = require('../../shared/utils/helpers');
const { createJournal, postJournal } = require('../../shared/journal/journalEngine');
const { authenticate } = require('../../shared/middleware/auth');
const { validate, rules } = require('../../shared/utils/validate');

const { required, string, number, integer, min, max, minLen, maxLen, date, boolean, email, array, minItems } = rules;

// Auto-create job orders for FG items in an invoice
async function createJobOrdersForInvoice(invoice) {
  const results = { created: [], skipped: [] };

  for (const line of invoice.lines) {
    const item = await prisma.item.findUnique({ where: { id: line.itemId } });
    if (!item || item.itemType !== 'finished_good') {
      results.skipped.push({ itemId: line.itemId, reason: 'not a finished_good' });
      continue;
    }

    // Find active BOM for this FG
    const bom = await prisma.bOM.findFirst({
      where: { finishedGoodId: item.id, active: true },
      include: { lines: { include: { material: true } } },
    });
    if (!bom) {
      results.skipped.push({ itemId: line.itemId, reason: 'no active BOM found' });
      continue;
    }

    // Calculate required materials
    const materials = bom.lines.map((bl) => ({
      materialId: bl.materialId,
      requiredQty: bl.quantityPerUnit * line.quantity,
      material: bl.material,
    }));

    // Check stock availability
    const shortages = materials.filter((m) => m.material.stock < m.requiredQty);
    const status = shortages.length === 0 ? 'ready' : 'waiting_material';

    // Create job order
    const jobOrder = await prisma.jobOrder.create({
      data: {
        jobOrderNo: generateTransactionNo('JO'),
        salesInvoiceId: invoice.id,
        salesInvoiceLineId: line.id,
        finishedGoodId: item.id,
        bomId: bom.id,
        plannedQty: line.quantity,
        status,
        materials: {
          create: materials.map((m) => ({
            materialId: m.materialId,
            requiredQty: m.requiredQty,
          })),
        },
      },
    });

    // Auto-create draft PO for shortages
    if (shortages.length > 0) {
      const posBySupplier = {};
      for (const shortage of shortages) {
        const shortfall = shortage.requiredQty - shortage.material.stock;
        // Find last supplier for this RM
        const lastPOLine = await prisma.purchaseOrderLine.findFirst({
          where: { itemId: shortage.materialId },
          include: { purchaseOrder: true },
          orderBy: { createdAt: 'desc' },
        });
        const supplierId = lastPOLine?.purchaseOrder?.supplierId;
        if (!supplierId) continue;

        if (!posBySupplier[supplierId]) posBySupplier[supplierId] = [];
        posBySupplier[supplierId].push({ itemId: shortage.materialId, shortfall, unitPrice: shortage.material.purchasePrice });
      }

      for (const [supplierId, items] of Object.entries(posBySupplier)) {
        const totalAmount = items.reduce((s, i) => s + i.shortfall * i.unitPrice, 0);
        await prisma.purchaseOrder.create({
          data: {
            poNumber: generateTransactionNo('PO'),
            supplierId,
            date: new Date(),
            status: 'draft',
            totalAmount,
            notes: `Auto-created for job order ${jobOrder.jobOrderNo}`,
            lines: {
              create: items.map((i) => ({
                itemId: i.itemId,
                quantity: Math.ceil(i.shortfall),
                unitPrice: i.unitPrice,
                totalAmount: Math.ceil(i.shortfall) * i.unitPrice,
              })),
            },
          },
        });
      }
    }

    results.created.push({ jobOrderNo: jobOrder.jobOrderNo, status, shortages: shortages.map((s) => s.material.name) });
  }

  return results;
}

router.use(authenticate);

// ============================================
// CUSTOMERS
// ============================================

router.get('/customers', async (req, res) => {
  try {
    const { search, active } = req.query;
    const { skip, take, page, limit } = parsePagination(req.query);
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (active !== undefined) where.active = active === 'true';
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({ where, orderBy: { name: 'asc' }, skip, take }),
      prisma.customer.count({ where }),
    ]);
    res.json(paginatedResponse(customers, total, page, limit));
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.get('/customers/:id', async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: { salesInvoices: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!customer) return res.status(404).json({ status: 'error', message: 'Customer not found' });
    res.json({ status: 'ok', data: customer });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.post(
  '/customers',
  validate({
    name: [required, string, minLen(2), maxLen(200)],
    email: [email],
    phone: [string, maxLen(20)],
    address: [string, maxLen(300)],
    city: [string, maxLen(100)],
    province: [string, maxLen(100)],
    postalCode: [string, maxLen(10)],
  }),
  async (req, res) => {
    try {
      const { name, email: emailVal, phone, address, city, province, postalCode } = req.body;
      const customer = await prisma.customer.create({
        data: { name, email: emailVal, phone, address, city, province, postalCode },
      });
      res.status(201).json({ status: 'ok', data: customer });
    } catch (error) {
      if (error.code === 'P2002') return res.status(400).json({ status: 'error', message: 'Email already exists' });
      res.status(500).json({ status: 'error', message: error.message });
    }
  }
);

router.put(
  '/customers/:id',
  validate({
    name: [string, minLen(2), maxLen(200)],
    email: [email],
    phone: [string, maxLen(20)],
    address: [string, maxLen(300)],
    city: [string, maxLen(100)],
    province: [string, maxLen(100)],
    postalCode: [string, maxLen(10)],
    active: [boolean],
  }),
  async (req, res) => {
    try {
      const { name, email: emailVal, phone, address, city, province, postalCode, active } = req.body;
      const customer = await prisma.customer.update({
        where: { id: req.params.id },
        data: { name, email: emailVal, phone, address, city, province, postalCode, active },
      });
      res.json({ status: 'ok', data: customer });
    } catch (error) {
      if (error.code === 'P2025') return res.status(404).json({ status: 'error', message: 'Customer not found' });
      res.status(500).json({ status: 'error', message: error.message });
    }
  }
);

router.delete('/customers/:id', async (req, res) => {
  try {
    await prisma.customer.update({ where: { id: req.params.id }, data: { active: false } });
    res.json({ status: 'ok', message: 'Customer deactivated' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ status: 'error', message: 'Customer not found' });
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================
// SALES INVOICES
// ============================================

router.get('/invoices', async (req, res) => {
  try {
    const { status, customerId } = req.query;
    const { skip, take, page, limit } = parsePagination(req.query);
    const where = {};
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    const [invoices, total] = await Promise.all([
      prisma.salesInvoice.findMany({
        where,
        include: {
          customer: { select: { name: true } },
          lines: { include: { item: { select: { name: true, uom: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.salesInvoice.count({ where }),
    ]);
    res.json(paginatedResponse(invoices, total, page, limit));
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.get('/invoices/:id', async (req, res) => {
  try {
    const invoice = await prisma.salesInvoice.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        lines: { include: { item: { select: { sku: true, name: true, uom: true, purchasePrice: true } } } },
        journal: { include: { lines: { include: { account: { select: { code: true, name: true } } } } } },
      },
    });
    if (!invoice) return res.status(404).json({ status: 'error', message: 'Invoice not found' });
    res.json({ status: 'ok', data: invoice });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.post(
  '/invoices',
  validate({
    customerId: [required, string],
    date: [required, date],
    dueDate: [date],
    taxRate: [number, min(0), max(100)],
    notes: [string, maxLen(500)],
    lines: [required, array, minItems(1)],
    'lines.*.itemId': [required, string],
    'lines.*.quantity': [required, integer, min(1)],
    'lines.*.unitPrice': [required, number, min(0)],
  }),
  async (req, res) => {
    try {
      const { customerId, date: dateVal, dueDate, taxRate = 11, notes, lines } = req.body;

      const subtotal = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
      const taxAmount = Math.round(subtotal * taxRate) / 100;
      const totalAmount = subtotal + taxAmount;

      const invoice = await prisma.salesInvoice.create({
        data: {
          invoiceNo: generateTransactionNo('INV'),
          customerId,
          date: new Date(dateVal),
          dueDate: dueDate ? new Date(dueDate) : null,
          status: 'draft',
          subtotal,
          taxRate,
          taxAmount,
          totalAmount,
          notes,
          lines: {
            create: lines.map((l) => ({
              itemId: l.itemId,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              totalAmount: l.quantity * l.unitPrice,
            })),
          },
        },
        include: {
          customer: { select: { name: true } },
          lines: { include: { item: { select: { name: true, uom: true } } } },
        },
      });

      // Auto-create job orders for FG items
      const invoiceWithLines = await prisma.salesInvoice.findUnique({
        where: { id: invoice.id },
        include: { lines: true },
      });
      const jobOrderResults = await createJobOrdersForInvoice(invoiceWithLines);

      res.status(201).json({ status: 'ok', data: invoice, jobOrders: jobOrderResults });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }
);

// Post invoice — deducts stock + double-entry journal including PPN
router.put('/invoices/:id/post', async (req, res) => {
  try {
    const invoice = await prisma.salesInvoice.findUnique({
      where: { id: req.params.id },
      include: { lines: { include: { item: true } } },
    });
    if (!invoice) return res.status(404).json({ status: 'error', message: 'Invoice not found' });
    if (invoice.status !== 'draft') {
      return res.status(400).json({ status: 'error', message: 'Only draft invoices can be posted' });
    }

    // Check all job orders are completed
    const pendingJobOrders = await prisma.jobOrder.findMany({
      where: { salesInvoiceId: req.params.id, status: { notIn: ['completed', 'cancelled'] } },
      select: { jobOrderNo: true, status: true, finishedGood: { select: { name: true } } },
    });
    if (pendingJobOrders.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'All job orders must be completed before posting invoice',
        pendingJobOrders,
      });
    }

    // Check stock availability
    for (const line of invoice.lines) {
      if (line.item.stock < line.quantity) {
        return res.status(400).json({
          status: 'error',
          message: `Insufficient stock for ${line.item.name}. Available: ${line.item.stock}, Required: ${line.quantity}`,
        });
      }
    }

    // Deduct stock and mark posted (sequential — PgBouncer compatible)
    for (const line of invoice.lines) {
      await prisma.stockMovement.create({
        data: {
          itemId: line.itemId,
          type: 'out',
          quantity: line.quantity,
          reference: invoice.invoiceNo,
          referenceType: 'sales',
          notes: `Sold via invoice ${invoice.invoiceNo}`,
        },
      });
      await prisma.item.update({
        where: { id: line.itemId },
        data: { stock: { decrement: line.quantity } },
      });
    }
    await prisma.salesInvoice.update({ where: { id: req.params.id }, data: { status: 'posted' } });

    const cogsTotal = invoice.lines.reduce((sum, l) => sum + l.quantity * l.item.purchasePrice, 0);

    // Journal entries (with PPN):
    // Debit  AR         (1200) = totalAmount (subtotal + PPN)
    // Credit Revenue    (4100) = subtotal
    // Credit Tax Payable(2200) = taxAmount   ← PPN terutang
    // Debit  COGS       (5100) = cogsTotal   (if any)
    // Credit Inventory  (1300) = cogsTotal
    try {
      const journalLines = [
        { accountCode: '1200', debit: invoice.totalAmount, credit: 0, description: 'Accounts receivable (incl. PPN)' },
        { accountCode: '4100', debit: 0, credit: invoice.subtotal, description: 'Sales revenue (DPP)' },
      ];
      if (invoice.taxAmount > 0) {
        journalLines.push(
          { accountCode: '2200', debit: 0, credit: invoice.taxAmount, description: `PPN ${invoice.taxRate}% terutang` }
        );
      }
      if (cogsTotal > 0) {
        journalLines.push(
          { accountCode: '5100', debit: cogsTotal, credit: 0, description: 'Cost of goods sold' },
          { accountCode: '1300', debit: 0, credit: cogsTotal, description: 'Inventory reduction' }
        );
      }

      const journal = await createJournal({
        date: invoice.date.toISOString(),
        description: `Sales invoice ${invoice.invoiceNo} (PPN ${invoice.taxRate}%)`,
        type: 'auto',
        reference: invoice.invoiceNo,
        referenceType: 'sales',
        lines: journalLines,
      });

      await prisma.salesInvoice.update({
        where: { id: req.params.id },
        data: { journal: { connect: { id: journal.id } } },
      });
      await postJournal(journal.id);
    } catch (journalErr) {
      console.warn('Journal creation skipped (COA may not be seeded):', journalErr.message);
    }

    const updated = await prisma.salesInvoice.findUnique({
      where: { id: req.params.id },
      include: {
        customer: { select: { name: true } },
        lines: { include: { item: { select: { name: true, uom: true } } } },
        journal: { include: { lines: { include: { account: { select: { code: true, name: true } } } } } },
      },
    });
    res.json({ status: 'ok', data: updated });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Cancel invoice
router.put('/invoices/:id/cancel', async (req, res) => {
  try {
    const invoice = await prisma.salesInvoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) return res.status(404).json({ status: 'error', message: 'Invoice not found' });
    if (invoice.status === 'paid') {
      return res.status(400).json({ status: 'error', message: 'Paid invoices cannot be cancelled' });
    }
    const updated = await prisma.salesInvoice.update({
      where: { id: req.params.id },
      data: { status: 'cancelled' },
    });
    res.json({ status: 'ok', data: updated });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Mark invoice as paid — Debit Cash (1100), Credit AR (1200)
router.put('/invoices/:id/pay', async (req, res) => {
  try {
    const invoice = await prisma.salesInvoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) return res.status(404).json({ status: 'error', message: 'Invoice not found' });
    if (invoice.status !== 'posted') {
      return res.status(400).json({ status: 'error', message: 'Only posted invoices can be marked as paid' });
    }

    await prisma.salesInvoice.update({ where: { id: req.params.id }, data: { status: 'paid' } });

    try {
      const journal = await createJournal({
        date: new Date().toISOString(),
        description: `Payment received for invoice ${invoice.invoiceNo}`,
        type: 'auto',
        reference: invoice.invoiceNo,
        referenceType: 'payment',
        lines: [
          { accountCode: '1100', debit: invoice.totalAmount, credit: 0, description: 'Cash received (incl. PPN)' },
          { accountCode: '1200', debit: 0, credit: invoice.totalAmount, description: 'AR cleared' },
        ],
      });
      await postJournal(journal.id);
    } catch (journalErr) {
      console.warn('Journal creation skipped (COA may not be seeded):', journalErr.message);
    }

    const updated = await prisma.salesInvoice.findUnique({ where: { id: req.params.id } });
    res.json({ status: 'ok', data: updated });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// PPN Summary — laporan PPN terutang per periode
router.get('/ppn-summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = { status: { in: ['posted', 'paid'] } };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const invoices = await prisma.salesInvoice.findMany({
      where,
      select: {
        invoiceNo: true, date: true, status: true,
        subtotal: true, taxRate: true, taxAmount: true, totalAmount: true,
        customer: { select: { name: true } },
      },
      orderBy: { date: 'asc' },
    });

    const totalDPP = invoices.reduce((sum, inv) => sum + inv.subtotal, 0);
    const totalPPN = invoices.reduce((sum, inv) => sum + inv.taxAmount, 0);
    const totalTagihan = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);

    res.json({
      status: 'ok',
      data: {
        invoices,
        summary: {
          count: invoices.length,
          totalDPP,
          totalPPN,
          totalTagihan,
          period: { startDate: startDate || null, endDate: endDate || null },
        },
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
