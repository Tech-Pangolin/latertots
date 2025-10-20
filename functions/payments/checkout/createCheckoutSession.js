// createCheckoutSession.js - Firebase Function v2 for creating Stripe Checkout Sessions
const { onRequest } = require('firebase-functions/v2/https');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const logger = require('firebase-functions/logger');
const { PAYMENT_TYPES, STRIPE_METADATA_KEYS } = require('../../constants');
const { stripeSecretKey, appUrl, reactUrl } = require('../../config');
const { getOrCreateStripeCustomer } = require('../helpers/customerHelpers');
const { calculateReservationPricing, createStripeCheckoutSession } = require('../helpers/checkoutHelpers');

const db = getFirestore();

/**
 * Create a Stripe Checkout Session for reservation payments
 * @param {Object} request - Firebase Functions request object
 * @param {Object} response - Firebase Functions response object
 * @returns {Promise<void>}
 */
exports.createCheckoutSession = onRequest(
  {
    secrets: [stripeSecretKey, appUrl, reactUrl],
    cors: true
  },
  async (request, response) => {
    try {
      const { reservations, paymentType, latertotsUserId, successUrl, cancelUrl, depositPayment } = request.body;
      
      // Validate input
      if (!reservations || !Array.isArray(reservations) || reservations.length === 0) {
        throw new Error('Reservations array is required and must not be empty');
      }
      
      if (!paymentType || !Object.values(PAYMENT_TYPES).includes(paymentType)) {
        throw new Error(`Payment type must be one of: ${Object.values(PAYMENT_TYPES).join(', ')}`);
      }
      
      if (!latertotsUserId) {
        throw new Error('Latertots User ID is required');
      }
      
      logger.debug('🚀 [createCheckoutSession] Creating checkout session:', {
        latertotsUserId,
        paymentType,
        reservationCount: reservations.length,
        groupActivities: reservations.filter(r => r.groupActivity).length
      });
      
      // Calculate pricing based on payment type
      const lineItems = calculateReservationPricing(reservations, paymentType);
      
      // Create or retrieve Stripe customer
      const stripelatertotsUserId = await getOrCreateStripeCustomer(
        latertotsUserId, 
        stripeSecretKey.value()
      );

      logger.debug('💰 [createCheckoutSession] Reservations:', reservations);
      
      // Create Checkout Session
      const session = await createStripeCheckoutSession({
        customer: stripelatertotsUserId,
        lineItems: lineItems,
        metadata: {
          [STRIPE_METADATA_KEYS.APP_USER_ID]: `Users/${latertotsUserId}`,
          [STRIPE_METADATA_KEYS.RESERVATION_IDS]: JSON.stringify(reservations.map(r => `Reservations/${r.reservationId}`)),
          [STRIPE_METADATA_KEYS.PAYMENT_TYPE]: paymentType,
          [STRIPE_METADATA_KEYS.DEPOSIT_PAYMENT]: depositPayment || null
        },
        successUrl: successUrl || `${reactUrl.value()}/schedule?payment=success`,
        cancelUrl: cancelUrl || `${reactUrl.value()}/schedule?payment=failed`,
        secretKey: stripeSecretKey.value()
      });
      
      logger.info('✅ [createCheckoutSession] Checkout session created successfully:', {
        sessionId: session.id,
        latertotsUserId: stripelatertotsUserId,
        paymentType
      });
      
      response.status(200).json({
        success: true,
        sessionId: session.id,
        url: session.url
      });
      
    } catch (error) {
      logger.error('❌ [createCheckoutSession] Failed to create checkout session:', {
        error: error.message,
        latertotsUserId: request.body?.latertotsUserId,
        paymentType: request.body?.paymentType
      });
      
      response.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
);
