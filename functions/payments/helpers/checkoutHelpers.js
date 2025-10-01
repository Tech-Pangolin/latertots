// checkoutHelpers.js - Stripe Checkout Session helpers
const logger = require('firebase-functions/logger');
const Stripe = require('stripe');
const { PAYMENT_PRICING, PAYMENT_TYPES, CHECKOUT_CONFIG, STRIPE_METADATA_KEYS } = require('../../constants');

/**
 * Calculate pricing for reservations based on payment type
 * @param {Array} reservations - Array of reservation objects
 * @param {string} paymentType - 'minimum' or 'full'
 * @returns {Array} - Array of Stripe line items
 */
const calculateReservationPricing = (reservations, paymentType) => {
  const lineItems = [];
  
  if (paymentType === PAYMENT_TYPES.MINIMUM) {
    // Calculate 2-hour minimum for each reservation
    const minimumRateCents = PAYMENT_PRICING.HOURLY_RATE_CENTS * PAYMENT_PRICING.MINIMUM_HOURS;
    
    reservations.forEach(reservation => {
      // Base minimum charge
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { 
            name: `Child Care - ${reservation.childName}`,
            description: `${PAYMENT_PRICING.MINIMUM_HOURS}-hour minimum deposit`
          },
          unit_amount: minimumRateCents
        },
        quantity: 1
      });
      
      // Add group activity fee if applicable
      if (reservation.groupActivity) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: { 
              name: `Group Activity - ${reservation.childName}`,
              description: 'Group activity participation fee'
            },
            unit_amount: PAYMENT_PRICING.GROUP_ACTIVITY_FEE_CENTS
          },
          quantity: 1
        });
      }
    });
  } else {
    // Calculate full amount for each reservation
    reservations.forEach(reservation => {
      const baseAmount = Math.round(PAYMENT_PRICING.HOURLY_RATE_CENTS * reservation.durationHours);
      
      // Base child care charge
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: { 
            name: `Child Care - ${reservation.childName}`,
            description: `Full payment - ${reservation.durationHours} hours`
          },
          unit_amount: baseAmount
        },
        quantity: 1
      });
      
      // Add group activity fee if applicable
      if (reservation.groupActivity) {
        lineItems.push({
          price_data: {
            currency: 'usd',
            product_data: { 
              name: `Group Activity - ${reservation.childName}`,
              description: 'Group activity participation fee'
            },
            unit_amount: PAYMENT_PRICING.GROUP_ACTIVITY_FEE_CENTS
          },
          quantity: 1
        });
      }
    });
  }
  
  logger.info('💰 [CHECKOUT] Calculated pricing:', {
    paymentType,
    reservationCount: reservations.length,
    lineItemCount: lineItems.length,
    groupActivities: reservations.filter(r => r.groupActivity).length
  });
  
  return lineItems;
};

/**
 * Create a Stripe Checkout Session
 * @param {Object} options - Checkout session options
 * @returns {Promise<Object>} - Stripe checkout session
 */
const createStripeCheckoutSession = async (options) => {
  const stripe = new Stripe(options.secretKey);
  
  try {
    const session = await stripe.checkout.sessions.create({
      customer: options.customer,
      payment_method_types: CHECKOUT_CONFIG.PAYMENT_METHOD_TYPES,
      line_items: options.lineItems,
      mode: 'payment',
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      automatic_tax: CHECKOUT_CONFIG.AUTOMATIC_TAX,
      metadata: options.metadata,
      customer_update: {
        address: 'auto'
      },
      payment_intent_data: {metadata: options.metadata},
      saved_payment_method_options: {
        payment_method_save: CHECKOUT_CONFIG.SAVE_PAYMENT_METHODS ? 'enabled' : 'disabled'
      },
      allow_promotion_codes: CHECKOUT_CONFIG.ALLOW_PROMOTION_CODES
    });
    
    logger.info('✅ [CHECKOUT] Created Stripe checkout session:', {
      sessionId: session.id,
      customerId: options.customer,
      paymentType: options.metadata[STRIPE_METADATA_KEYS.PAYMENT_TYPE]
    });
    
    return session;
  } catch (error) {
    logger.error('❌ [CHECKOUT] Failed to create checkout session:', {
      error: error.message,
      customerId: options.customer
    });
    throw error;
  }
};

module.exports = {
  calculateReservationPricing,
  createStripeCheckoutSession
};
