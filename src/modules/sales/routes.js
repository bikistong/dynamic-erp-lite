const express = require('express');
const router = express.Router();
const prisma = require('../../shared/db/prisma');
const { generateTransactionNo, parsePagination, paginatedResponse } = require('../../shared/utils/helpers');
const { createJournal, postJournal } = require('../../shared/journal/journalEngine');
const { authenticate } = require('../../shared/middleware/auth');
const { validate, rules } = require('../../shared/utils/validate');

const { required, string, number, integer, min, minLen, maxLen, date, boolean, email, array, minItems } = rules;

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
    notes: [string, maxLen(500)],
    lines: [required, array, minItems(1)],
    'lines.*.itemId': [required, string],
    'lines.*.quantity': [required, integer, min(1)],
    'lines.*.unitPrice': [required, number, min(0)],
  }),
  async (req, res) => {
  try {
    const { customerId, date: dateVal, dueDate, notes, lines } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      const totalAmount = lines.reduce((sum, l) => sum + l.quantity * l.unitPrice, 0);
      const invoice = await tx.salesInvoice.create({
        data: {
          invoiceNo: generateTransactionNo('INV'),
          customerId,
          date: new Date(dateVal),
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
        include: {
          customer: { select: { name: true } },
          lines: { include: { item: { select: { name: true, uom: true } } } },
        },
      });
      return invoice;
    });

    res.status(201).json({ status: 'ok', data: result });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
  }
);

// Post invoice — deducts stock and creates accounting journal
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

    // Check stock availability
    for (const line of invoice.lines) {
      if (line.item.stock < line.quantity) {
        return res.status(400).json({
          status: 'error',
          message: `Insufficient stock for ${line.item.name}. Available: ${line.item.stock}, Required: ${line.quantity}`,
        });
      }
    }

    // Deduct stock and create movements
    await prisma.$transaction(async (tx) => {
      for (const line of invoice.lines) {
        await tx.stockMovement.create({
          data: {
            itemId: line.itemId,
            type: 'out',
            quantity: line.quantity,
            reference: invoice.invoiceNo,
            referenceType: 'sales',
            notes: `Sold via invoice ${invoice.invoiceNo}`,
          },
        });
        await tx.item.update({
          where: { id: line.itemId },
          data: { stock: { decrement: line.quantity } },
        });
      }
      await tx.salesInvoice.update({ where: { id: req.params.id }, data: { status: 'posted' } });
    });

    // Calculate COGS
    const cogsTotal = invoice.lines.reduce((sum, l) => sum + l.quantity * l.item.purchasePrice, 0);

    // Journal entries:
    // 1. AR (1200) debit, Revenue (4100) credit — for the sale
    // 2. COGS (5100) debit, Inventory (1300) credit — for cost of goods sold
    try {
      const journalLines = [
        { accountCode: '1200', debit: invoice.totalAmount, credit: 0, description: 'Accounts receivable' },
        { accountCode: '4100', debit: 0, credit: invoice.totalAmount, description: 'Sales revenue' },
      ];
      if (cogsTotal > 0) {
        journalLines.push(
          { accountCode: '5100', debit: cogsTotal, credit: 0, description: 'Cost of goods sold' },
          { accountCode: '1300', debit: 0, credit: cogsTotal, description: 'Inventory reduction' }
        );
      }
      const journal = await createJournal({
        date: new Date().toISOString(),
        description: `Sales invoice ${invoice.invoiceNo}`,
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
      include: { customer: { select: { name: true } }, lines: { include: { item: { select: { name: true } } } } },
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

// Mark invoice as paid
router.put('/invoices/:id/pay', async (req, res) => {
  try {
    const invoice = await prisma.salesInvoice.findUnique({ where: { id: req.params.id } });
    if (!invoice) return res.status(404).json({ status: 'error', message: 'Invoice not found' });
    if (invoice.status !== 'posted') {
      return res.status(400).json({ status: 'error', message: 'Only posted invoices can be marked as paid' });
    }
    const updated = await prisma.salesInvoice.update({
      where: { id: req.params.id },
      data: { status: 'paid' },
    });

    // Journal: Debit Cash (1100), Credit AR (1200)
    try {
      const journal = await createJournal({
        date: new Date().toISOString(),
        description: `Payment received for invoice ${invoice.invoiceNo}`,
        type: 'auto',
        reference: invoice.invoiceNo,
        referenceType: 'payment',
        lines: [
          { accountCode: '1100', debit: invoice.totalAmount, credit: 0, description: 'Cash received' },
          { accountCode: '1200', debit: 0, credit: invoice.totalAmount, description: 'AR cleared' },
        ],
      });
      await postJournal(journal.id);
    } catch (journalErr) {
      console.warn('Journal creation skipped (COA may not be seeded):', journalErr.message);
    }

    res.json({ status: 'ok', data: updated });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
