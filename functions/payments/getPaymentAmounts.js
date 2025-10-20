// getPaymentAmounts.js - Cloud function to get actual payment amounts from Stripe
const { onRequest } = require('firebase-functions/v2/https');
const Stripe = require('stripe');
const { stripeSecretKey } = require('../config');
const logger = require('firebase-functions/logger');

/**
 * Get actual payment amounts from Stripe Payment Intent IDs
 * @param {Object} request - Firebase Functions request object
 * @param {Object} response - Firebase Functions response object
 * @returns {Promise<void>}
 */
exports.getPaymentAmounts = onRequest(
  {
    secrets: [stripeSecretKey],
    cors: true
  },
  async (request, response) => {
    try {
      const { paymentIntentIds } = request.body;
    
      if (!paymentIntentIds || !Array.isArray(paymentIntentIds)) {
        return response.status(400).json({
          success: false,
          error: 'paymentIntentIds array is required'
        });
      }
      logger.info('💰 [getPaymentAmounts] Fetching payment amounts:', { 
        paymentIntentIds,
        count: paymentIntentIds.length 
      });
      
      // Initialize Stripe with .value() method
      const stripe = new Stripe(stripeSecretKey.value());
      
      // Query Stripe for each payment intent
      const paymentAmounts = {};
      
      for (const paymentIntentId of paymentIntentIds) {
        if (!paymentIntentId) continue; // Skip null/undefined IDs
        
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          
          // Only include successful payments
          if (paymentIntent.status === 'succeeded') {
            paymentAmounts[paymentIntentId] = paymentIntent.amount;
            logger.debug('✅ [getPaymentAmounts] Found payment:', {
              paymentIntentId,
              amount: paymentIntent.amount,
              status: paymentIntent.status
            });
          } else {
            logger.debug('⚠️ [getPaymentAmounts] Payment not succeeded:', {
              paymentIntentId,
              status: paymentIntent.status
            });
            paymentAmounts[paymentIntentId] = 0;
          }
        } catch (error) {
          logger.warn('❌ [getPaymentAmounts] Failed to retrieve payment intent:', {
            paymentIntentId,
            error: error.message
          });
          paymentAmounts[paymentIntentId] = 0;
        }
      }
      
      logger.info('✅ [getPaymentAmounts] Returning payment amounts:', { 
        paymentAmounts,
        totalAmount: Object.values(paymentAmounts).reduce((sum, amount) => sum + amount, 0)
      });
      
      response.status(200).json({
        success: true,
        paymentAmounts
      });
      
    } catch (error) {
      logger.error('❌ [getPaymentAmounts] Failed to get payment amounts:', {
        paymentIntentIds: request.body?.paymentIntentIds,
        error: error.message,
        stack: error.stack
      });
      
      response.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
);
