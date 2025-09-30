// guards.js - XState v5 Guards
const logger = require('firebase-functions/logger');

// Check if all reservations are processed
const isReservationPassComplete = ({ context }) => {
  // Safety check - if reservations array doesn't exist yet, we're not complete
  if (!context.reservations || !Array.isArray(context.reservations)) {
    logger.warn('⚠️ [BILLING] Reservations not loaded yet, cannot move to calculate charges', { runId: context.runId });
    return false;
  }
  
  const isComplete = context.resIdx >= context.reservations.length;
  if (isComplete) {
    logger.info(`✅ [BILLING] All ${context.reservations.length} reservations processed, moving to overdue invoices`);
  }
  return isComplete;
};

// Check if all overdue invoices are processed
const isOverduePassComplete = ({ context }) => {
  const isComplete = context.overIdx >= context.overdueInvoices.length;
  if (isComplete) {
    logger.info(`✅ [BILLING] All ${context.overdueInvoices.length} overdue invoices processed, wrapping up`);
  }
  return isComplete;
};


// Error categorization guards
const isCriticalError = ({ context }) => {
  const errorType = context.lastError?.errorType;
  const result = errorType === 'PERMISSION' || errorType === 'RESOURCE_LIMIT' || errorType === 'UNKNOWN';
  logger.info('🔍 [BILLING] isCriticalError guard - DEBUG:', {
    errorType,
    result,
    lastError: context.lastError,
    contextRunId: context.runId
  });
  return result;
};

const isBusinessLogicError = ({ context }) => {
  const errorType = context.lastError?.errorType;
  const result = errorType === 'BUSINESS_LOGIC' || errorType === 'VALIDATION';
  logger.info('🔍 [BILLING] isBusinessLogicError guard - DEBUG:', {
    errorType,
    result,
    lastError: context.lastError,
    contextRunId: context.runId
  });
  return result;
};

const isTransientError = ({ context }) => {
  const errorType = context.lastError?.errorType;
  const retryable = context.lastError?.retryable;
  const result = errorType === 'NETWORK' && retryable;
  logger.info('🔍 [BILLING] isTransientError guard - DEBUG:', {
    errorType,
    retryable,
    result,
    lastError: context.lastError,
    contextRunId: context.runId
  });
  return result;
};

const isRetryableError = ({ context }) => {
  return context.lastError?.retryable === true;
};

const hasRetryAttemptsRemaining = ({ context }) => {
  const retryCount = context.lastError?.retryCount || 0;
  const result = retryCount < 3; // Max 3 retries
  logger.info('🔍 [BILLING] hasRetryAttemptsRemaining guard - DEBUG:', {
    retryCount,
    result,
    lastError: context.lastError,
    contextRunId: context.runId
  });
  return result;
};

module.exports = {
  isReservationPassComplete,
  isOverduePassComplete,
  isCriticalError,
  isBusinessLogicError,
  isTransientError,
  isRetryableError,
  hasRetryAttemptsRemaining
};
