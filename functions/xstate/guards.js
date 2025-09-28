// guards.js - XState v5 Guards
const { logger } = require('firebase-functions');

// Check if all reservations are processed
const isReservationPassComplete = ({ context }) => {
  // Safety check - if reservations array doesn't exist yet, we're not complete
  if (!context.reservations || !Array.isArray(context.reservations)) {
    logger.warn('⚠️ [BILLING] Reservations not loaded yet, cannot move to calculate charges', { runId: context.runId });
    return false;
  }
  
  const isComplete = context.resIdx >= context.reservations.length;
  if (isComplete) {
    logger.info('✅ [BILLING] All reservations processed, moving to overdue invoices');
  }
  return isComplete;
};

// Check if all overdue invoices are processed
const isOverduePassComplete = ({ context }) => {
  const isComplete = context.overIdx >= context.overdueInvoices.length;
  if (isComplete) {
    logger.info('✅ [BILLING] All overdue invoices processed, wrapping up');
  }
  return isComplete;
};

// Check if dry run mode
const isDryRun = ({ context }) => {
  return context.dryRun === true;
};

module.exports = {
  isReservationPassComplete,
  isOverduePassComplete,
  isDryRun
};
