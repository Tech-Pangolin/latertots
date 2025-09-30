// actions.js - XState v5 Actions
const { assign } = require('xstate');
const logger = require('firebase-functions/logger');

// Increment reservation index
const incrementResIdx = assign({ 
  resIdx: ({ context }) => {
    const newIdx = context.resIdx + 1;
    return newIdx;
  }
});

// Increment overdue index
const incrementOverIdx = assign({ 
  overIdx: ({ context }) => {
    const newIdx = context.overIdx + 1;
    return newIdx;
  }
});

// Add failure record
const addFailure = assign(({ context: ctx, event: ev }) => {
  const currentFailures = Array.isArray(ctx.failures) ? ctx.failures : [];
  
  // Extract error from XState v5 error event - try multiple paths
  let errorMessage = 'Unknown error';
  let errorDetails = ev;
  let enrichedError = null;
  
  if (ev === undefined || ev === null) {
    errorMessage = 'Actor failed with no error details';
    errorDetails = { type: 'undefined_error', message: 'No error information available' };
  } else if (ev?.error) {
    // Check if this is an enriched error from our actors
    if (ev.error.errorType && ev.error.operation) {
      enrichedError = ev.error;
      errorMessage = ev.error.message;
      errorDetails = ev.error;
    } else {
      errorMessage = ev.error.message || 'Unknown error';
      errorDetails = ev.error;
    }
  } else if (ev?.message) {
    errorMessage = ev.message;
  } else if (ev?.data?.message) {
    errorMessage = ev.data.message;
    errorDetails = ev.data;
  } else if (typeof ev === 'string') {
    errorMessage = ev;
  } else if (ev?.toString) {
    errorMessage = ev.toString();
  }
  
  // Create failure record with enhanced context
  const failure = {
    timestamp: new Date().toISOString(),
    error: errorMessage,
    errorDetails: errorDetails,
    context: {
      runId: ctx.runId,
      resIdx: ctx.resIdx,
      overIdx: ctx.overIdx
    }
  };
  
  // Add enriched error context if available
  if (enrichedError) {
    failure.errorType = enrichedError.errorType;
    failure.operation = enrichedError.operation;
    failure.actor = enrichedError.actor;
    failure.retryable = enrichedError.retryable;
    failure.retryCount = enrichedError.retryCount || 0;
    failure.context = {
      ...failure.context,
      ...enrichedError.context
    };
  }
  
  const newFailures = [...currentFailures, failure];
  
  logger.error('🔧 [BILLING] Adding failure for incomplete business operation:', { 
    error: errorMessage, 
    errorType: failure.errorType,
    operation: failure.operation,
    actor: failure.actor,
    retryable: failure.retryable,
    retryCount: failure.retryCount,
    reservationId: failure.context.reservationId,
    invoiceId: failure.context.invoiceId,
    totalFailures: newFailures.length
  });
  
  return { failures: newFailures };
});

// Categorize error and determine next state
const categorizeError = assign(({ event, context }) => {
  const error = event.error || event;
  const errorType = error.errorType || 'UNKNOWN';
  const retryable = error.retryable || false;
  
  logger.info('🔍 [BILLING] Categorizing error - FULL DEBUG:', {
    errorType,
    retryable,
    operation: error.operation,
    actor: error.actor,
    context: error.context,
    fullError: error,
    eventType: typeof event,
    eventKeys: Object.keys(event || {}),
    contextRunId: context.runId,
    contextFailuresCount: context.failures?.length || 0,
    contextReservationsCount: context.reservations?.length || 0
  });
  
  return {
    lastError: {
      errorType,
      retryable,
      operation: error.operation,
      actor: error.actor,
      context: error.context
    }
  };
});

// Log error details
const logError = ({ event, context }) => {
  const error = event.error || event;
  logger.error('❌ [BILLING] Error occurred:', {
    errorType: error.errorType,
    operation: error.operation,
    actor: error.actor,
    retryable: error.retryable,
    message: error.message,
    context: error.context,
    runId: context.runId
  });
};

module.exports = {
  incrementResIdx,
  incrementOverIdx,
  addFailure,
  categorizeError,
  logError
};
