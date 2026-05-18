const express = require('express');
const router = express.Router();
const prisma = require('../../shared/db/prisma');
const { createJournal, postJournal } = require('../../shared/journal/journalEngine');
const { authenticate, requireAdmin } = require('../../shared/middleware/auth');
const { parsePagination, paginatedResponse } = require('../../shared/utils/helpers');
const { validate, rules } = require('../../shared/utils/validate');

const { required, string, number, min, minLen, maxLen, date, boolean, array, minItems, enum: enumRule } = rules;

router.use(authenticate);

// ============================================
// CHART OF ACCOUNTS
// ============================================

router.get('/accounts', async (req, res) => {
  try {
    const { type, active, search } = req.query;
    const { skip, take, page, limit } = parsePagination(req.query);
    const where = {};
    if (type) where.type = type;
    if (active !== undefined) where.active = active === 'true';
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [accounts, total] = await Promise.all([
      prisma.chartOfAccounts.findMany({ where, orderBy: { code: 'asc' }, skip, take }),
      prisma.chartOfAccounts.count({ where }),
    ]);
    res.json(paginatedResponse(accounts, total, page, limit));
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.get('/accounts/:id', async (req, res) => {
  try {
    const account = await prisma.chartOfAccounts.findUnique({ where: { id: req.params.id } });
    if (!account) return res.status(404).json({ status: 'error', message: 'Account not found' });
    res.json({ status: 'ok', data: account });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.post(
  '/accounts',
  validate({
    code: [required, string, minLen(1), maxLen(20)],
    name: [required, string, minLen(2), maxLen(200)],
    type: [required, enumRule(['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'])],
    description: [string, maxLen(300)],
  }),
  async (req, res) => {
    try {
      const { code, name, type, description } = req.body;
      const account = await prisma.chartOfAccounts.create({ data: { code, name, type, description } });
      res.status(201).json({ status: 'ok', data: account });
    } catch (error) {
      if (error.code === 'P2002') return res.status(400).json({ status: 'error', message: 'Account code already exists' });
      res.status(500).json({ status: 'error', message: error.message });
    }
  }
);

router.put(
  '/accounts/:id',
  validate({
    name: [string, minLen(2), maxLen(200)],
    type: [enumRule(['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'])],
    description: [string, maxLen(300)],
    active: [boolean],
  }),
  async (req, res) => {
    try {
      const { name, type, description, active } = req.body;
      const account = await prisma.chartOfAccounts.update({
        where: { id: req.params.id },
        data: { name, type, description, active },
      });
      res.json({ status: 'ok', data: account });
    } catch (error) {
      if (error.code === 'P2025') return res.status(404).json({ status: 'error', message: 'Account not found' });
      res.status(500).json({ status: 'error', message: error.message });
    }
  }
);

router.delete('/accounts/:id', async (req, res) => {
  try {
    await prisma.chartOfAccounts.update({ where: { id: req.params.id }, data: { active: false } });
    res.json({ status: 'ok', message: 'Account deactivated' });
  } catch (error) {
    if (error.code === 'P2025') return res.status(404).json({ status: 'error', message: 'Account not found' });
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Seed default chart of accounts (admin only)
router.post('/accounts/seed', requireAdmin, async (req, res) => {
  try {
    const defaultAccounts = [
      // Assets
      { code: '1100', name: 'Cash', type: 'Asset', description: 'Cash on hand and in bank' },
      { code: '1200', name: 'Accounts Receivable', type: 'Asset', description: 'Money owed by customers' },
      { code: '1300', name: 'Inventory', type: 'Asset', description: 'Stock of goods' },
      { code: '1400', name: 'Prepaid Expenses', type: 'Asset', description: 'Expenses paid in advance' },
      { code: '1500', name: 'Fixed Assets', type: 'Asset', description: 'Property, plant, equipment' },
      // Liabilities
      { code: '2100', name: 'Accounts Payable', type: 'Liability', description: 'Money owed to suppliers' },
      { code: '2200', name: 'Taxes Payable', type: 'Liability', description: 'Taxes due to government' },
      { code: '2300', name: 'Accrued Liabilities', type: 'Liability', description: 'Expenses incurred but not yet paid' },
      // Equity
      { code: '3100', name: "Owner's Capital", type: 'Equity', description: "Owner's investment" },
      { code: '3200', name: 'Retained Earnings', type: 'Equity', description: 'Accumulated profits' },
      // Revenue
      { code: '4100', name: 'Sales Revenue', type: 'Revenue', description: 'Revenue from sales' },
      { code: '4200', name: 'Other Income', type: 'Revenue', description: 'Non-operating income' },
      // Expenses
      { code: '5100', name: 'Cost of Goods Sold', type: 'Expense', description: 'Direct cost of products sold' },
      { code: '5200', name: 'Operating Expenses', type: 'Expense', description: 'General and administrative' },
      { code: '5300', name: 'Salary Expense', type: 'Expense', description: 'Wages and salaries' },
      { code: '5400', name: 'Rent Expense', type: 'Expense', description: 'Office and warehouse rent' },
      { code: '5500', name: 'Utilities Expense', type: 'Expense', description: 'Electricity, water, internet' },
    ];

    const created = [];
    const skipped = [];

    for (const acc of defaultAccounts) {
      const existing = await prisma.chartOfAccounts.findUnique({ where: { code: acc.code } });
      if (!existing) {
        const created_acc = await prisma.chartOfAccounts.create({ data: acc });
        created.push(created_acc);
      } else {
        skipped.push(acc.code);
      }
    }

    res.status(201).json({
      status: 'ok',
      message: `Seeded ${created.length} accounts, skipped ${skipped.length} existing`,
      data: { created: created.length, skipped: skipped.length, skippedCodes: skipped },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================
// JOURNALS
// ============================================

router.get('/journals', async (req, res) => {
  try {
    const { status, type, startDate, endDate } = req.query;
    const { skip, take, page, limit } = parsePagination(req.query);
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    const [journals, total] = await Promise.all([
      prisma.journal.findMany({
        where,
        include: { lines: { include: { account: { select: { code: true, name: true } } } } },
        orderBy: { date: 'desc' },
        skip,
        take,
      }),
      prisma.journal.count({ where }),
    ]);
    res.json(paginatedResponse(journals, total, page, limit));
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

router.get('/journals/:id', async (req, res) => {
  try {
    const journal = await prisma.journal.findUnique({
      where: { id: req.params.id },
      include: {
        lines: { include: { account: { select: { code: true, name: true, type: true } } } },
        generalLedger: true,
      },
    });
    if (!journal) return res.status(404).json({ status: 'error', message: 'Journal not found' });
    res.json({ status: 'ok', data: journal });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Create manual journal
router.post(
  '/journals',
  validate({
    date: [required, date],
    description: [required, string, minLen(3), maxLen(300)],
    lines: [required, array, minItems(2)],
    'lines.*.accountCode': [required, string],
    'lines.*.debit': [number, min(0)],
    'lines.*.credit': [number, min(0)],
    'lines.*.description': [string, maxLen(200)],
  }),
  async (req, res) => {
    try {
      const { date: dateVal, description, lines } = req.body;
      const journal = await createJournal({ date: dateVal, description, type: 'manual', lines });
      res.status(201).json({ status: 'ok', data: journal });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }
);

// Post journal to general ledger
router.put('/journals/:id/post', async (req, res) => {
  try {
    const journal = await postJournal(req.params.id);
    res.json({ status: 'ok', data: journal });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================
// GENERAL LEDGER
// ============================================

router.get('/ledger', async (req, res) => {
  try {
    const { accountId, accountCode, startDate, endDate } = req.query;
    const { skip, take, page, limit } = parsePagination(req.query);
    const where = {};
    if (accountId) {
      where.accountId = accountId;
    } else if (accountCode) {
      const account = await prisma.chartOfAccounts.findUnique({ where: { code: accountCode } });
      if (!account) return res.status(404).json({ status: 'error', message: 'Account not found' });
      where.accountId = account.id;
    }
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }
    const [entries, total] = await Promise.all([
      prisma.generalLedger.findMany({
        where,
        include: {
          account: { select: { code: true, name: true, type: true } },
          journal: { select: { journalNo: true, description: true, reference: true } },
        },
        orderBy: { date: 'asc' },
        skip,
        take,
      }),
      prisma.generalLedger.count({ where }),
    ]);
    res.json(paginatedResponse(entries, total, page, limit));
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ============================================
// REPORTS
// ============================================

// Trial Balance
router.get('/reports/trial-balance', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const accounts = await prisma.chartOfAccounts.findMany({
      where: { active: true },
      include: {
        generalLedger: {
          where: Object.keys(dateFilter).length > 0 ? { date: dateFilter } : undefined,
        },
      },
      orderBy: { code: 'asc' },
    });

    const rows = accounts
      .map((acc) => {
        const totalDebit = acc.generalLedger.reduce((sum, e) => sum + e.debit, 0);
        const totalCredit = acc.generalLedger.reduce((sum, e) => sum + e.credit, 0);
        return {
          code: acc.code,
          name: acc.name,
          type: acc.type,
          totalDebit,
          totalCredit,
          balance: totalDebit - totalCredit,
        };
      })
      .filter((r) => r.totalDebit !== 0 || r.totalCredit !== 0);

    const grandDebit = rows.reduce((sum, r) => sum + r.totalDebit, 0);
    const grandCredit = rows.reduce((sum, r) => sum + r.totalCredit, 0);

    res.json({
      status: 'ok',
      data: {
        rows,
        totals: { debit: grandDebit, credit: grandCredit, balanced: Math.abs(grandDebit - grandCredit) < 0.01 },
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Profit & Loss (Income Statement)
router.get('/reports/profit-loss', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const ledgerWhere = Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {};

    const [revenueAccounts, expenseAccounts] = await Promise.all([
      prisma.chartOfAccounts.findMany({
        where: { type: 'Revenue', active: true },
        include: { generalLedger: { where: ledgerWhere } },
        orderBy: { code: 'asc' },
      }),
      prisma.chartOfAccounts.findMany({
        where: { type: 'Expense', active: true },
        include: { generalLedger: { where: ledgerWhere } },
        orderBy: { code: 'asc' },
      }),
    ]);

    const revenue = revenueAccounts.map((acc) => ({
      code: acc.code,
      name: acc.name,
      amount: acc.generalLedger.reduce((sum, e) => sum + e.credit - e.debit, 0),
    }));

    const expenses = expenseAccounts.map((acc) => ({
      code: acc.code,
      name: acc.name,
      amount: acc.generalLedger.reduce((sum, e) => sum + e.debit - e.credit, 0),
    }));

    const totalRevenue = revenue.reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    res.json({
      status: 'ok',
      data: {
        revenue,
        expenses,
        totalRevenue,
        totalExpenses,
        netProfit,
        period: { startDate: startDate || null, endDate: endDate || null },
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Balance Sheet
router.get('/reports/balance-sheet', async (req, res) => {
  try {
    const { asOf } = req.query;
    const dateFilter = asOf ? { lte: new Date(asOf) } : {};
    const ledgerWhere = Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {};

    const accounts = await prisma.chartOfAccounts.findMany({
      where: { active: true, type: { in: ['Asset', 'Liability', 'Equity'] } },
      include: { generalLedger: { where: ledgerWhere } },
      orderBy: { code: 'asc' },
    });

    const grouped = { Asset: [], Liability: [], Equity: [] };
    for (const acc of accounts) {
      const debit = acc.generalLedger.reduce((sum, e) => sum + e.debit, 0);
      const credit = acc.generalLedger.reduce((sum, e) => sum + e.credit, 0);
      const balance = acc.type === 'Asset' ? debit - credit : credit - debit;
      if (balance !== 0) {
        grouped[acc.type].push({ code: acc.code, name: acc.name, balance });
      }
    }

    const totalAssets = grouped.Asset.reduce((sum, a) => sum + a.balance, 0);
    const totalLiabilities = grouped.Liability.reduce((sum, a) => sum + a.balance, 0);
    const totalEquity = grouped.Equity.reduce((sum, a) => sum + a.balance, 0);

    res.json({
      status: 'ok',
      data: {
        assets: grouped.Asset,
        liabilities: grouped.Liability,
        equity: grouped.Equity,
        totals: {
          assets: totalAssets,
          liabilities: totalLiabilities,
          equity: totalEquity,
          liabilitiesAndEquity: totalLiabilities + totalEquity,
          balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
        },
        asOf: asOf || null,
      },
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

module.exports = router;
