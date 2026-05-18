// src/shared/utils/helpers.js
// Shared utility functions

/**
 * Generate unique transaction number
 * @param {string} prefix - Prefix (PO, INV, JNL)
 * @returns {string} Unique number
 */
function generateTransactionNo(prefix) {
  const date = new Date();
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}-${timestamp}`.slice(0, 30);
}

/**
 * Format currency
 * @param {number} value
 * @param {string} currency - IDR, USD, etc
 * @returns {string} Formatted currency
 */
function formatCurrency(value, currency = 'IDR') {
  const formatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency,
  });
  return formatter.format(value);
}

/**
 * Format date
 * @param {Date|string} date
 * @returns {string} Formatted date (YYYY-MM-DD)
 */
function formatDate(date) {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/**
 * Calculate balance for ledger
 * @param {number} previousBalance
 * @param {number} debit
 * @param {number} credit
 * @returns {number} New balance
 */
function calculateBalance(previousBalance, debit, credit) {
  return previousBalance + debit - credit;
}

/**
 * Validate email
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validate phone number (Indonesian format)
 * @param {string} phone
 * @returns {boolean}
 */
function isValidPhone(phone) {
  const re = /^(\+62|0)[0-9]{9,12}$/;
  return re.test(phone.replace(/\s/g, ''));
}

/**
 * API Response wrapper
 * @param {number} statusCode
 * @param {string} message
 * @param {any} data
 * @returns {Object}
 */
function apiResponse(statusCode, message, data = null) {
  return {
    statusCode,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Error response wrapper
 * @param {number} statusCode
 * @param {string} message
 * @param {string} error
 * @returns {Object}
 */
function errorResponse(statusCode, message, error = null) {
  return {
    statusCode,
    message,
    error,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Parse pagination params from query string
 * @param {Object} query - req.query
 * @returns {{ skip: number, take: number, page: number, limit: number }}
 */
function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  return { skip: (page - 1) * limit, take: limit, page, limit };
}

/**
 * Build paginated response envelope
 */
function paginatedResponse(data, total, page, limit) {
  return {
    status: 'ok',
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
}

module.exports = {
  generateTransactionNo,
  formatCurrency,
  formatDate,
  calculateBalance,
  isValidEmail,
  isValidPhone,
  apiResponse,
  errorResponse,
  parsePagination,
  paginatedResponse,
};
