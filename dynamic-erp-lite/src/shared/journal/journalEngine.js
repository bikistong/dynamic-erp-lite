// src/shared/journal/journalEngine.js
// Shared journal creation engine

const prisma = require('../db/prisma');

/**
 * Create journal entry with lines
 * @param {Object} data
 * @param {string} data.date - Transaction date
 * @param {string} data.description - Journal description
 * @param {string} data.type - 'manual' atau 'auto'
 * @param {string} data.reference - Reference number (PO, Invoice, etc)
 * @param {string} data.referenceType - Type of reference (po, sales, receipt)
 * @param {Array} data.lines - Journal lines [{ accountCode, debit, credit, description }]
 * @returns {Promise<Object>} Created journal
 */
async function createJournal(data) {
  try {
    const {
      date,
      description,
      type = 'auto',
      reference,
      referenceType,
      lines,
    } = data;

    // Validate debit = credit
    const totalDebit = lines.reduce((sum, line) => sum + (line.debit || 0), 0);
    const totalCredit = lines.reduce((sum, line) => sum + (line.credit || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(`Debit (${totalDebit}) must equal Credit (${totalCredit})`);
    }

    // Create journal with transaction
    const journal = await prisma.$transaction(async (tx) => {
      // 1. Create journal header
      const newJournal = await tx.journal.create({
        data: {
          journalNo: `JNL-${Date.now()}`, // TODO: Generate proper sequence
          date: new Date(date),
          description,
          type,
          reference,
          referenceType,
          status: 'draft',
        },
      });

      // 2. Create journal lines
      for (const line of lines) {
        // Get account by code
        const account = await tx.chartOfAccounts.findUnique({
          where: { code: line.accountCode },
        });

        if (!account) {
          throw new Error(`Account code ${line.accountCode} not found`);
        }

        await tx.journalLine.create({
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
    });

    return journal;
  } catch (error) {
    console.error('Error creating journal:', error);
    throw error;
  }
}

/**
 * Post journal entries to general ledger
 * @param {string} journalId
 * @returns {Promise<Object>} Posted journal
 */
async function postJournal(journalId) {
  try {
    const journal = await prisma.$transaction(async (tx) => {
      // Get journal with lines
      const journalData = await tx.journal.findUnique({
        where: { id: journalId },
        include: { lines: true },
      });

      if (!journalData) {
        throw new Error('Journal not found');
      }

      if (journalData.status !== 'draft') {
        throw new Error('Only draft journals can be posted');
      }

      // Create ledger entries
      for (const line of journalData.lines) {
        await tx.generalLedger.create({
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

      // Update journal status
      const postedJournal = await tx.journal.update({
        where: { id: journalId },
        data: { status: 'posted' },
      });

      return postedJournal;
    });

    return journal;
  } catch (error) {
    console.error('Error posting journal:', error);
    throw error;
  }
}

module.exports = {
  createJournal,
  postJournal,
};
