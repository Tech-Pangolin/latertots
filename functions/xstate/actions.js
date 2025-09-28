// actions.js - XState v5 Actions
const { assign } = require('xstate');
const { logger } = require('firebase-functions');

// Store initialization data
const storeInitData = assign({
  runId: ({ context, event }) => {
    // Debug: Log the full event structure
    logger.info('🔍 [BILLING] Full event structure:', JSON.stringify(event, null, 2));
    logger.info('🔍 [BILLING] Event type:', typeof event);
    logger.info('🔍 [BILLING] Event keys:', Object.keys(event || {}));
    
    // In XState v5, actor results come in event.output
    const data = event?.output || {};
    logger.info('🔧 [BILLING] Storing run data:', { 
      runId: data.runId, 
      reservationCount: data.reservations?.length || 0
    });
    return data.runId || '';
  },
  reservations: ({ context, event }) => {
    // In XState v5, actor results come in event.output
    const data = event?.output || {};
    logger.info('🔧 [BILLING] Storing reservations:', data.reservations?.length || 0, 'reservations found');
    return data.reservations || [];
  }
});

// Increment reservation index
const incrementResIdx = assign({ 
  resIdx: ({ context }) => {
    const newIdx = context.resIdx + 1;
    logger.info(`🔧 [BILLING] Incrementing reservation index: ${context.resIdx} → ${newIdx}`);
    return newIdx;
  }
});

// Increment overdue index
const incrementOverIdx = assign({ 
  overIdx: ({ context }) => {
    const newIdx = context.overIdx + 1;
    logger.info(`🔧 [BILLING] Incrementing overdue index: ${context.overIdx} → ${newIdx}`);
    return newIdx;
  }
});

// Add failure record
const addFailure = assign(({ context, event }) => {
  const currentFailures = Array.isArray(context.failures) ? context.failures : [];
  
  // Debug: Log the full event structure
  logger.info('🔍 [BILLING] Full error event structure:', JSON.stringify(event, null, 2));
  logger.info('🔍 [BILLING] Event type:', typeof event);
  logger.info('🔍 [BILLING] Event is undefined:', event === undefined);
  
  // Extract error from XState v5 error event - try multiple paths
  let errorMessage = 'Unknown error';
  let errorDetails = event;
  
  if (event === undefined || event === null) {
    errorMessage = 'Actor failed with no error details';
    errorDetails = { type: 'undefined_error', message: 'No error information available' };
  } else if (event?.error?.message) {
    errorMessage = event.error.message;
    errorDetails = event.error;
  } else if (event?.error) {
    errorMessage = typeof event.error === 'string' ? event.error : event.error.message || 'Unknown error';
    errorDetails = event.error;
  } else if (event?.message) {
    errorMessage = event.message;
  } else if (event?.data?.message) {
    errorMessage = event.data.message;
    errorDetails = event.data;
  } else if (typeof event === 'string') {
    errorMessage = event;
  } else if (event?.toString) {
    errorMessage = event.toString();
  }
  
  const newFailures = [...currentFailures, {
    timestamp: new Date().toISOString(),
    error: errorMessage,
    errorDetails: errorDetails,
    context: {
      runId: context.runId,
      resIdx: context.resIdx,
      overIdx: context.overIdx
    }
  }];
  
  logger.error('🔧 [BILLING] Adding failure:', { 
    error: errorMessage, 
    totalFailures: newFailures.length,
    errorDetails: errorDetails
  });
  
  return { failures: newFailures };
});

module.exports = {
  storeInitData,
  incrementResIdx,
  incrementOverIdx,
  addFailure
};
