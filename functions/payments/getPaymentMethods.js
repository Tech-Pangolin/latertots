// getPaymentMethods.js - Cloud function to fetch payment methods with full details
const { onCall } = require('firebase-functions/v2/https');
const { getFirestore } = require('firebase-admin/firestore');
const Stripe = require('stripe');
const { stripeSecretKey } = require('../config');
const logger = require('firebase-functions/logger');

const db = getFirestore();

exports.getPaymentMethods = onCall(
  {
    secrets: [stripeSecretKey]
  },
  async (request) => {
    let userId = request.auth?.uid;
    
    if (!userId) {
      userId = request.data?.userId;
      logger.info('🔍 [getPaymentMethods] Using userId from data parameter:', userId);
    }
    
    if (!userId) {
      logger.error('❌ [getPaymentMethods] No authenticated user found');
      throw new Error('User not authenticated');
    }
    
    try {
      logger.info('🔍 [getPaymentMethods] Fetching payment methods for user:', { userId });
      
      // Get user's Stripe customer ID
      const userDoc = await db.collection('Users').doc(userId).get();
      if (!userDoc.exists) {
        logger.warn('❌ [getPaymentMethods] User document not found:', { userId });
        return { paymentMethods: [] };
      }
      
      const userData = userDoc.data();
      const stripeCustomerId = userData.stripeCustomerId;
      
      if (!stripeCustomerId) {
        logger.info('ℹ️ [getPaymentMethods] User has no Stripe customer ID:', { userId });
        return { paymentMethods: [] };
      }
      
      // Query Stripe for payment methods
      const stripe = new Stripe(stripeSecretKey.value());
      const stripePaymentMethods = await stripe.paymentMethods.list({
        customer: stripeCustomerId,
        type: 'card',
        limit: 100
      });
      
      logger.info('💳 [getPaymentMethods] Found payment methods:', { 
        userId, 
        count: stripePaymentMethods.data.length 
      });
      
      // Map Stripe payment methods to our response format
      const paymentMethods = stripePaymentMethods.data.map(pm => ({
        id: pm.id,
        type: pm.type,
        card: {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
          funding: pm.card.funding
        }
      }));
      
      logger.info('✅ [getPaymentMethods] Returning payment methods:', { 
        userId, 
        paymentMethodCount: paymentMethods.length 
      });
      
      return { paymentMethods };
      
    } catch (error) {
      logger.error('❌ [getPaymentMethods] Failed to get payment methods:', {
        userId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
);
