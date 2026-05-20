const express = require('express');
const router = express.Router();
const prisma = require('../../shared/db/prisma');
const { createJournal, postJournal } = require('../../shared/journal/journalEngine');
const { authenticate } = require('../../shared/middleware/auth');
const { validate, rules } = require('../../shared/utils/validate');

const { required, string, number, min, date, enum: enumRule } = rules;

router.use(authenticate);

// GET /api/bank/accounts — semua akun COA tipe Asset (kas & setara kas)
router.get('/accounts', async (req, res) => {
  try {
    const accounts = await prisma.chartOfAccounts.findMany({
      where: { type: 'Asset', active: true },
      orderBy: { code: 'asc' },
    });
    // Hitung saldo tiap akun dari GL
    const withBalance = await Promise.all(
      accounts.map(async (acc) => {
        const agg = await prisma.generalLedger.aggregate({
          where: { accountId: acc.id },
          _sum: { debit: true, credit: true },
        });
        const balance = (agg._sum.debit || 0) - (agg._sum.credit || 0);
        return { ...acc, balance };
      })
    );
    res.json({ status: 'ok', data: withBalance });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// GET /api/bank/ledger/:accountId — riwayat transaksi + saldo berjalan
router.get('/ledger/:accountId', async (req, res) => {
  try {
    const { dateFrom, dateTo } = req.query;
    const where = { accountId: req.params.accountId };
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo + 'T23:59:59Z');
    }

    const account = await prisma.chartOfAccounts.findUnique({ where: { id: req.params.accountId } });
    if (!account) return res.status(404).json({ status: 'error', message: 'Account not found' });

    // Saldo sebelum periode (untuk running balance)
    let openingBalance = 0;
    if (dateFrom) {
      const before = await prisma.generalLedger.aggregate({
        where: { accountId: req.params.accountId, date: { lt: new Date(dateFrom) } },
        _sum: { debit: true, credit: true },
      });
      openingBalance = (before._sum.debit || 0) - (before._sum.credit || 0);
    }

    const entries = await prisma.generalLedger.findMany({
      where,
      include: { journal: { select: { journalNo: true, description: true, reference: true, type: true } } },
      orderBy: { date: 'asc' },
    });

    let running = openingBalance;
    const rows = entries.map((e) => {
      running += e.debit - e.credit;
      return { ...e, runningBalance: running };
    });

    res.json({ status: 'ok', data: { account, openingBalance, entries: rows } });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// POST /api/bank/transactions — kas masuk / kas keluar
router.post(
  '/transactions',
  validate({
    type: [required, enumRule(['masuk', 'keluar'])],
    bankAccountCode: [required, string],
    counterAccountCode: [required, string],
    amount: [required, number, min(0.01)],
    date: [required, date],
    description: [required, string],
    reference: [string],
  }),
  async (req, res) => {
    try {
      const { type, bankAccountCode, counterAccountCode, amount, date: dateVal, description, reference } = req.body;

      const [bankAcc, counterAcc] = await Promise.all([
        prisma.chartOfAccounts.findUnique({ where: { code: bankAccountCode } }),
        prisma.chartOfAccounts.findUnique({ where: { code: counterAccountCode } }),
      ]);
      if (!bankAcc) return res.status(404).json({ status: 'error', message: `Akun ${bankAccountCode} tidak ditemukan` });
      if (!counterAcc) return res.status(404).json({ status: 'error', message: `Akun ${counterAccountCode} tidak ditemukan` });

      // Kas masuk: Debit bank, Credit counter
      // Kas keluar: Debit counter, Credit bank
      const lines =
        type === 'masuk'
          ? [
              { accountCode: bankAccountCode, debit: amount, credit: 0, description },
              { accountCode: counterAccountCode, debit: 0, credit: amount, description },
            ]
          : [
              { accountCode: counterAccountCode, debit: amount, credit: 0, description },
              { accountCode: bankAccountCode, debit: 0, credit: amount, description },
            ];

      const journal = await createJournal({
        date: dateVal,
        description,
        type: 'auto',
        reference,
        referenceType: 'bank',
        lines,
      });
      await postJournal(journal.id);

      res.status(201).json({ status: 'ok', data: journal });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }
);

module.exports = router;
