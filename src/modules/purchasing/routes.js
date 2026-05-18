const express = require('express');
const router = express.Router();
const prisma = require('../../shared/db/prisma');
const { generateTransactionNo } = require('../../shared/utils/helpers');
const { createJournal, postJournal } = require('../../shared/journal/journalEngine');

// ============================================
// SUPPLIERS
// ============================================

router.get('/suppliers', async (req, res) => {
  try {
    const { search, active } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (active !== undefined) where.active = active === 'true';
    const suppliers = await prisma.supplier.findMany({ where, orderBy: { name: 'asc' } });
    res.json({ status: 'ok', data: suppliers, total: suppliers.length });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.get('/suppliers/:id', async (req, res) => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: req.params.id },
      include: { purchaseOrders: { orderBy: { createdAt: 'desc' }, take: 10 } },
    });
    if (!supplier) return res.status(404).json({ status: 'error', message: 'Supplier not found' });
    res.json({ status: 'ok', data: supplier });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.post('/suppliers', async (req, res) => {
  try {
    const { name, email, phone, address, city, province, postalCode } = req.body;
    if (!name) return res.status(400).json({ status: 'error', message: 'name is required' });
    const supplier = await prisma.supplier.create({
      data: { name, email, phone, address, city, province, postalCode },
    });
    res.status(201).json({ status: 'ok', data: supplier });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ status: 'error', message: 'Email already exists' });
    }
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.put('/suppliers/:id', async (req, res) => {
  try {
    const { name, email, phone, address, city, province, postalCode, active } = req.body;
    const supplier = await prisma.supplier.update({
      where: { id: req.params.id },
      data: { name, email, phone, address, city, province, postalCode, active },
    });
    res.json({ status: 'ok', data: supplier });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ status: 'error', message: 'Supplier not found' });
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.delete('/suppliers/:id', async (req, res) => {
  try {
    await prisma.supplier.update({ where: { id: req.params.id }, data: { active: false } });
    res.json({ status: 'ok', message: 'Supplier deactivated' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ status: 'error', message: 'Supplier not found' });
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================
// PURCHASE ORDERS
// ============================================

router.get('/orders', async (req, res) => {
  try {
    const { status, supplierId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    const orders = await prisma.purchaseOrder.findMany({
      where,
      include: { supplier: { select: { name: true } }, lines: { include: { item: { select: { name: true, uom: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ status: 'ok', data: orders, total: orders.length });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.get('/orders/:id', async (req, res) => {
  try {
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: {
        supplier: true,
        lines: { include: { item: { select: { sku: true, name: true, uom: true } } } },
        journal: { include: { lines: { include: { account: { select: { code: true, name: true } } } } } },
      },
    });
    if (!order) return res.status(404).json({ status: 'error', message: 'Purchase order not found' });
    res.json({ status: 'ok', data: order });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.post('/orders', async (req, res) => {
  try {
    const { supplierId, date, dueDate, notes, lines } = req.body;
    if (!supplierId || !date || !lines || lines.length === 0) {
      return res.status(400).json({ status: 'error', message: 'supplierId, date, and lines are required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const totalAmount = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
      const order = await tx.purchaseOrder.create({
        data: {
          poNumber: generateTransactionNo('PO'),
          supplierId,
          date: new Date(date),
          dueDate: dueDate ? new Date(dueDate) : null,
          status: 'draft',
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
        include: { lines: { include: { item: { select: { name: true, uom: true } } } }, supplier: { select: { name: true } } },
      });
      return order;
    });

    res.status(201).json({ status: 'ok', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Submit PO
router.put('/orders/:id/submit', async (req, res) => {
  try {
    const order = await prisma.purchaseOrder.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ status: 'error', message: 'Purchase order not found' });
    if (order.status !== 'draft') {
      return res.status(400).json({ status: 'error', message: 'Only draft orders can be submitted' });
    }
    const updated = await prisma.purchaseOrder.update({
      where: { id: req.params.id },
      data: { status: 'submitted' },
    });
    res.json({ status: 'ok', data: updated });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Cancel PO
router.put('/orders/:id/cancel', async (req, res) => {
  try {
    const order = await prisma.purchaseOrder.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ status: 'error', message: 'Purchase order not found' });
    if (order.status === 'received') {
      return res.status(400).json({ status: 'error', message: 'Received orders cannot be cancelled' });
    }
    const updated = await prisma.purchaseOrder.update({
      where: { id: req.params.id },
      data: { status: 'cancelled' },
    });
    res.json({ status: 'ok', data: updated });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================
// PURCHASE RECEIPTS (Goods Received)
// ============================================

router.get('/receipts', async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const receipts = await prisma.purchaseReceipt.findMany({
      where,
      include: { stockMovements: { include: { item: { select: { name: true, uom: true } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ status: 'ok', data: receipts, total: receipts.length });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.get('/receipts/:id', async (req, res) => {
  try {
    const receipt = await prisma.purchaseReceipt.findUnique({
      where: { id: req.params.id },
      include: {
        stockMovements: { include: { item: { select: { sku: true, name: true, uom: true } } } },
        journal: { include: { lines: { include: { account: { select: { code: true, name: true } } } } } },
      },
    });
    if (!receipt) return res.status(404).json({ status: 'error', message: 'Receipt not found' });
    res.json({ status: 'ok', data: receipt });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Create receipt (goods received) — updates stock + creates journal
router.post('/receipts', async (req, res) => {
  try {
    const { poId, date, notes, lines } = req.body;
    if (!poId || !date || !lines || lines.length === 0) {
      return res.status(400).json({ status: 'error', message: 'poId, date, and lines are required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: poId },
        include: { supplier: true, lines: { include: { item: true } } },
      });
      if (!po) throw new Error('Purchase order not found');
      if (!['submitted', 'received'].includes(po.status)) {
        throw new Error('Purchase order must be in submitted status to receive');
      }

      // Create receipt
      const receiptNo = generateTransactionNo('GRN');
      const receipt = await tx.purchaseReceipt.create({
        data: {
          receiptNumber: receiptNo,
          poNumber: po.poNumber,
          date: new Date(date),
          status: 'posted',
          notes,
        },
      });

      let totalReceived = 0;

      // Create stock movements and update stock for each line received
      for (const line of lines) {
        const poLine = po.lines.find((l) => l.itemId === line.itemId);
        if (!poLine) throw new Error(`Item ${line.itemId} is not in purchase order`);

        await tx.stockMovement.create({
          data: {
            itemId: line.itemId,
            type: 'in',
            quantity: line.quantity,
            reference: receiptNo,
            referenceType: 'po',
            notes: `Received from PO ${po.poNumber}`,
            receiptId: receipt.id,
          },
        });

        await tx.item.update({
          where: { id: line.itemId },
          data: { stock: { increment: line.quantity } },
        });

        await tx.purchaseOrderLine.update({
          where: { id: poLine.id },
          data: { receivedQty: { increment: line.quantity } },
        });

        totalReceived += line.quantity * poLine.unitPrice;
      }

      // Update PO status to received
      await tx.purchaseOrder.update({ where: { id: poId }, data: { status: 'received' } });

      return { receipt, totalReceived, poNumber: po.poNumber };
    });

    // Create accounting journal: Debit Inventory (1300), Credit AP (2100)
    try {
      const journal = await createJournal({
        date: req.body.date,
        description: `Goods received from PO ${result.poNumber} - Receipt ${result.receipt.receiptNumber}`,
        type: 'auto',
        reference: result.receipt.receiptNumber,
        referenceType: 'receipt',
        lines: [
          { accountCode: '1300', debit: result.totalReceived, credit: 0, description: 'Stock received' },
          { accountCode: '2100', debit: 0, credit: result.totalReceived, description: 'Accounts payable' },
        ],
      });

      await prisma.purchaseReceipt.update({
        where: { id: result.receipt.id },
        data: { journal: { connect: { id: journal.id } } },
      });

      await postJournal(journal.id);
    } catch (journalErr) {
      // Journal creation is best-effort; log but don't fail the receipt
      console.warn('Journal creation skipped (COA may not be seeded):', journalErr.message);
    }

    res.status(201).json({ status: 'ok', data: result.receipt });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
