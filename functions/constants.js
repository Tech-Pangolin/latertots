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

// Legacy invoice and payment activity constants removed

// default logging configuration
const LOG_LEVEL = 'INFO';

const STRIPE = {
  API_VERSION: '2025-08-27.basil'
}

// NEW: Payment pricing configuration
const PAYMENT_PRICING = {
  HOURLY_RATE_CENTS: 2000,           // $20/hour in cents
  MINIMUM_HOURS: 2,                   // 2-hour minimum per reservation
  LATE_FEE_THRESHOLD_HOURS: 4,        // Late fee applies after 4 hours
  LATE_FEE_CENTS: 500,                // $5 late fee
  MAX_BILLABLE_HOURS: 8,              // Maximum 8 hours per reservation
  GROUP_ACTIVITY_FEE_CENTS: 500      // $5 group activity fee
};

// NEW: Payment types for new system
const PAYMENT_TYPES = {
  MINIMUM: 'minimum',                 // Pay 2-hour minimum upfront
  FULL: 'full'                       // Pay full amount upfront
};

// NEW: Deposit types for payment selection
const DEPOSIT_TYPES = {
  MINIMUM: 'minimum',                 // Pay 2-hour minimum upfront
  FULL: 'full'                       // Pay full amount upfront
};

// NEW: Checkout session configuration (URLs will be set at runtime)
const CHECKOUT_CONFIG = {
  PAYMENT_METHOD_TYPES: ['card'],
  ALLOW_PROMOTION_CODES: true,
  SAVE_PAYMENT_METHODS: true,
  AUTOMATIC_TAX: { enabled: true }   // Enable Stripe Tax
};

// NEW: Stripe customer metadata keys
const STRIPE_METADATA_KEYS = {
  APP_USER_ID: 'appUserId',
  RESERVATION_IDS: 'reservationIds',
  PAYMENT_TYPE: 'paymentType'
};

// NEW: Invoice line item tags (extend existing)
const LINE_ITEM_TAGS = {
  BASE: 'BASE',
  LATE_PICKUP: 'LATE_PICKUP',
  LATE_FEE: 'LATE_FEE',
  MINIMUM_DEPOSIT: 'MINIMUM_DEPOSIT',    // New: for minimum payments
  REMAINDER: 'REMAINDER',                 // New: for remainder payments
  GROUP_ACTIVITY: 'GROUP_ACTIVITY'       // New: for group activity fees
};

module.exports = {
  RESERVATION_STATUS,
  LOG_LEVEL,
  STRIPE,
  // NEW exports
  PAYMENT_PRICING,
  PAYMENT_TYPES,
  DEPOSIT_TYPES,
  CHECKOUT_CONFIG,
  STRIPE_METADATA_KEYS,
  LINE_ITEM_TAGS
};