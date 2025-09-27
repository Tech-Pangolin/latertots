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
  const errorData = ev?.data || ev?.error || 'Unknown error';
  const newFailures = [...currentFailures, {
    timestamp: new Date().toISOString(),
    error: errorData,
    context: {
      runId: ctx.runId,
      resIdx: ctx.resIdx,
      overIdx: ctx.overIdx
    }
  }];
  logger.error('🔧 [BILLING] Adding failure:', { 
    error: errorData, 
    totalFailures: newFailures.length 
  });
  return { failures: newFailures };
});

module.exports = {
  storeInitData,
  incrementResIdx,
  incrementOverIdx,
  addFailure
};
