// actions.js - XState v5 Actions
const { assign } = require('xstate');
const { logger } = require('firebase-functions');

// Store initialization data
const storeInitData = assign({
  runId: (_ctx, ev) => {
    const data = ev?.data || ev?.output || {};
    logger.info('🔧 [BILLING] Storing run data:', { 
      runId: data.runId, 
      reservationCount: data.reservations?.length || 0
    });
    return data.runId || '';
  },
  reservations: (_ctx, ev) => {
    const data = ev?.data || ev?.output || {};
    logger.info('🔧 [BILLING] Storing reservations:', data.reservations?.length || 0, 'reservations found');
    return data.reservations || [];
  }
});

// Increment reservation index
const incrementResIdx = assign({ 
  resIdx: (ctx) => {
    const newIdx = ctx.resIdx + 1;
    logger.info(`🔧 [BILLING] Incrementing reservation index: ${ctx.resIdx} → ${newIdx}`);
    return newIdx;
  }
});

// Increment overdue index
const incrementOverIdx = assign({ 
  overIdx: (ctx) => {
    const newIdx = ctx.overIdx + 1;
    logger.info(`🔧 [BILLING] Incrementing overdue index: ${ctx.overIdx} → ${newIdx}`);
    return newIdx;
  }
});

// Add failure record
const addFailure = assign((ctx, ev) => {
  const currentFailures = Array.isArray(ctx.failures) ? ctx.failures : [];
  
  // Debug: Log the full event structure
  logger.info('🔍 [BILLING] Full error event structure:', JSON.stringify(ev, null, 2));
  logger.info('🔍 [BILLING] Event type:', typeof ev);
  logger.info('🔍 [BILLING] Event is undefined:', ev === undefined);
  
  // Extract error from XState v5 error event - try multiple paths
  let errorMessage = 'Unknown error';
  let errorDetails = ev;
  
  if (ev === undefined || ev === null) {
    errorMessage = 'Actor failed with no error details';
    errorDetails = { type: 'undefined_error', message: 'No error information available' };
  } else if (ev?.error?.message) {
    errorMessage = ev.error.message;
    errorDetails = ev.error;
  } else if (ev?.error) {
    errorMessage = typeof ev.error === 'string' ? ev.error : ev.error.message || 'Unknown error';
    errorDetails = ev.error;
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
  
  const newFailures = [...currentFailures, {
    timestamp: new Date().toISOString(),
    error: errorMessage,
    errorDetails: errorDetails,
    context: {
      runId: ctx.runId,
      resIdx: ctx.resIdx,
      overIdx: ctx.overIdx
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
