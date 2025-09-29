// constants.js - CommonJS constants for Cloud Functions
// 
// ⚠️  IMPORTANT: This file contains a subset of constants from src/Helpers/constants.mjs
// ⚠️  When updating constants, check if changes need to be made in BOTH files:
// ⚠️  - src/Helpers/constants.mjs (ES module for React app)
// ⚠️  - functions/constants.js (CommonJS for Cloud Functions)
// ⚠️  This duplication exists due to module system incompatibility between React (ESM) and Cloud Functions (CommonJS)

// Constants used by billing machine
const RESERVATION_STATUS = {
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

const INVOICE_STATUS = {
  UNPAID: 'unpaid',
  PAID: 'paid',
  LATE: 'late',
  CANCELLED: 'cancelled'
};

module.exports = {
  RESERVATION_STATUS,
  INVOICE_STATUS
};
