// guards.js - XState v5 Guards
const { logger } = require('firebase-functions');

// Check if all reservations are processed
const isReservationPassComplete = (ctx) => {
  const isComplete = ctx.resIdx >= ctx.reservations.length;
  if (isComplete) {
    logger.info('✅ [BILLING] All reservations processed, moving to overdue invoices');
  }
  return isComplete;
};

// Check if all overdue invoices are processed
const isOverduePassComplete = (ctx) => {
  const isComplete = ctx.overIdx >= ctx.overdueInvoices.length;
  if (isComplete) {
    logger.info('✅ [BILLING] All overdue invoices processed, wrapping up');
  }
  return isComplete;
};

// Check if dry run mode
const isDryRun = (ctx) => {
  return ctx.dryRun === true;
};

module.exports = {
  isReservationPassComplete,
  isOverduePassComplete,
  isDryRun
};
