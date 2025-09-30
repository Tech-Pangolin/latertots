const { onRequest } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');

exports.dailyBillingJob = onRequest(async (req, res) => {
  try {
    // Get parameters from query string or environment
    const logLevel = req.query.logLevel || process.env.LOG_LEVEL || 'INFO';

    logger.info('🚀 [fxn:dailyBillingJob]: Daily billing job triggered via HTTP', {
      timestamp: new Date().toISOString(),
      logLevel,
      userAgent: req.get('User-Agent'),
      method: req.method,
      url: req.url
    });

    // Execute billing machine v5
    const { billingMachineV5 } = require('./xstate/indexV5');
    const { createActor } = require('xstate');

    // Create and start the v5 actor
    const actor = createActor(billingMachineV5).start();

    // Wait for completion
    await new Promise((resolve, reject) => {
      actor.subscribe((snapshot) => {
        if (snapshot.matches('completedSuccessfully') || snapshot.matches('completedWithProblems')) {
          resolve();
        } else if (snapshot.matches('fatalError') || snapshot.matches('initializationFailed')) {
          reject(new Error('❌ [fxn:dailyBillingJob]: Billing job failed'));
        }
      });
    });

    logger.info('🎉 [fxn:dailyBillingJob]: Daily billing job completed successfully', {
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ [fxn:dailyBillingJob]: Daily billing job failed', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
