// getPaymentHistory.js - Cloud function to fetch payment history from Stripe
const { onCall } = require('firebase-functions/v2/https');
const { getFirestore } = require('firebase-admin/firestore');
const Stripe = require('stripe');
const { stripeSecretKey } = require('../config');
const { STRIPE_METADATA_KEYS } = require('../constants');
const logger = require('firebase-functions/logger');

const db = getFirestore();

/**
 * Get payment history for the authenticated user
 * @param {Object} data - Empty object (no parameters needed)
 * @param {Object} context - Firebase function context with auth
 * @returns {Promise<Object>} - Payment history array
 */
exports.getPaymentHistory = onCall(
  {
    secrets: [stripeSecretKey]
  },
  async (request) => {
    // Debug: Log the request structure (Firebase Functions v2 uses request object)
    logger.info('🔍 [getPaymentHistory] Request structure:', {
      hasAuth: !!request.auth,
      authKeys: request.auth ? Object.keys(request.auth) : 'auth is undefined',
      requestKeys: Object.keys(request),
      data: request.data
    });
  
  // Try to get user ID from request.auth.uid first, then fall back to data parameter
  let userId = request.auth?.uid;
  
  if (!userId) {
    // Fallback: get user ID from data parameter (passed from frontend)
    userId = request.data?.userId;
    logger.info('🔍 [getPaymentHistory] Using userId from data parameter:', userId);
  }
  
  if (!userId) {
    logger.error('❌ [getPaymentHistory] No authenticated user found in request.auth or request.data');
    throw new Error('User not authenticated');
  }
  
  try {
    logger.info('🔍 [getPaymentHistory] Fetching payment history for user:', { userId });
    
    // 1. Get user's Stripe customer ID
    const userDoc = await db.collection('Users').doc(userId).get();
    if (!userDoc.exists) {
      logger.warn('❌ [getPaymentHistory] User document not found:', { userId });
      return { payments: [] };
    }
    
    const userData = userDoc.data();
    const stripeCustomerId = userData.stripeCustomerId;
    
    if (!stripeCustomerId) {
      logger.info('ℹ️ [getPaymentHistory] User has no Stripe customer ID:', { userId });
      return { payments: [] };
    }
    
    // 2. Query Stripe for payment intents
    const stripe = new Stripe(stripeSecretKey.value());
    const paymentIntents = await stripe.paymentIntents.list({
      customer: stripeCustomerId,
      limit: 100 // Stripe's default limit
    });
    
    logger.info('💰 [getPaymentHistory] Found payment intents:', { 
      userId, 
      count: paymentIntents.data.length 
    });
    
    // 3. Process each payment intent to extract reservation data
    const payments = [];
    
    for (const paymentIntent of paymentIntents.data) {
      // Only include successful payments
      if (paymentIntent.status !== 'succeeded') {
        continue;
      }
      
      // Extract reservation metadata
      const metadata = paymentIntent.metadata;
      const reservationIds = JSON.parse(metadata[STRIPE_METADATA_KEYS.RESERVATION_IDS] || '[]');
      const paymentType = metadata[STRIPE_METADATA_KEYS.PAYMENT_TYPE];
      
      // Get reservation details from Firestore
      for (const reservationPath of reservationIds) {
        const reservationId = reservationPath.split('/')[1];
        const reservationDoc = await db.collection('Reservations').doc(reservationId).get();
        
        if (reservationDoc.exists) {
          const reservation = reservationDoc.data();
          
          payments.push({
            serviceDate: reservation.start,
            childName: reservation.title,
            amount: paymentIntent.amount,
            paymentDate: paymentIntent.created,
            status: 'paid',
            paymentType: paymentType === 'full' ? 'Full' : (paymentType === 'remainder' ? 'Final Payment' : 'Deposit')
          });
        }
      }
    }
    
    // 4. Sort by service date (most recent first)
    payments.sort((a, b) => new Date(b.serviceDate) - new Date(a.serviceDate));
    
    logger.info('✅ [getPaymentHistory] Returning payment history:', { 
      userId, 
      paymentCount: payments.length 
    });
    
    return { payments };
    
  } catch (error) {
    logger.error('❌ [getPaymentHistory] Failed to get payment history:', {
      userId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
});
