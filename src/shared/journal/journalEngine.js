// src/shared/journal/journalEngine.js
const prisma = require('../db/prisma');

async function createJournal(data) {
  try {
    const { date, description, type = 'auto', reference, referenceType, lines } = data;

    const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Debit (${totalDebit}) must equal Credit (${totalCredit})`);
    }

    // Sequential ops — compatible with PgBouncer transaction pooler
    const newJournal = await prisma.journal.create({
      data: {
        journalNo: `JNL-${Date.now()}`,
        date: new Date(date),
        description,
        type,
        reference,
        referenceType,
        status: 'draft',
      },
    });

    for (const line of lines) {
      const account = await prisma.chartOfAccounts.findUnique({ where: { code: line.accountCode } });
      if (!account) throw new Error(`Account code ${line.accountCode} not found`);
      await prisma.journalLine.create({
        data: {
          journalId: newJournal.id,
          accountId: account.id,
          description: line.description,
          debit: line.debit || 0,
          credit: line.credit || 0,
        },
      });
    }

    return newJournal;
  } catch (error) {
    console.error('Error creating journal:', error);
    throw error;
  }
}

async function postJournal(journalId) {
  try {
    const journalData = await prisma.journal.findUnique({
      where: { id: journalId },
      include: { lines: true },
    });
    if (!journalData) throw new Error('Journal not found');
    if (journalData.status !== 'draft') throw new Error('Only draft journals can be posted');

    for (const line of journalData.lines) {
      await prisma.generalLedger.create({
        data: {
          accountId: line.accountId,
          journalId,
          date: journalData.date,
          description: line.description,
          debit: line.debit,
          credit: line.credit,
          balance: line.debit - line.credit,
        },
      });
    }

    const postedJournal = await prisma.journal.update({
      where: { id: journalId },
      data: { status: 'posted' },
    });

    return postedJournal;
  } catch (error) {
    console.error('Error posting journal:', error);
    throw error;
  }
}

module.exports = { createJournal, postJournal };
