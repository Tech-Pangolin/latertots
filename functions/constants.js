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

// Payment processing configuration
const PAYMENT_CONFIG = {
  MAX_RETRY_ATTEMPTS: 3,              // Maximum retry attempts per payment
  RETRY_INTERVAL_HOURS: 24,           // Hours between retry attempts
  PAYMENT_PROCESSING_SCHEDULE: '0 9,15,21 * * *'  // 9 AM, 3 PM, 9 PM daily
};

// Payment activity types
const PAYMENT_ACTIVITY_TYPES = {
  PAYMENT_ATTEMPT: 'PAYMENT_ATTEMPT',
  RETRY: 'RETRY',
  REFUND: 'REFUND',
  DISPUTE: 'DISPUTE'
};

// Payment activity statuses
const PAYMENT_ACTIVITY_STATUS = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED'
};

module.exports = {
  RESERVATION_STATUS,
  INVOICE_STATUS,
  PAYMENT_CONFIG,
  PAYMENT_ACTIVITY_TYPES,
  PAYMENT_ACTIVITY_STATUS
};