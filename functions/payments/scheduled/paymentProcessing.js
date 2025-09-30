const functions = require('firebase-functions/v1');
const logger = require('firebase-functions/logger');

exports.processScheduledPayments = functions.pubsub
  .schedule('0 9,15,21 * * *') // 9 AM, 3 PM, 9 PM daily
  .onRun(async (context) => {
    try {
      logger.info('⏰ [fxn:processScheduledPayments]: Starting scheduled payment processing', {
        timestamp: new Date().toISOString()
      });

      // Process scheduled payments
      const { processScheduledPayments } = require('../helpers/retryHelpers');
      const result = await processScheduledPayments();

      logger.info('✅ [fxn:processScheduledPayments]: Scheduled payment processing completed', {
        result,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('❌ [fxn:processScheduledPayments]: Scheduled payment processing failed', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    }
  });
