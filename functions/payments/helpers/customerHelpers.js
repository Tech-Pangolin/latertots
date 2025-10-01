// customerHelpers.js - Stripe customer management helpers
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const logger = require('firebase-functions/logger');
const Stripe = require('stripe');
const { STRIPE_METADATA_KEYS } = require('../../constants');

const db = getFirestore();

/**
 * Get or create a Stripe customer for an app user
 * @param {string} latertotsUserId - The app user ID
 * @param {Object} userData - User data (email, name, phone)
 * @param {string} secretKey - Stripe secret key from Secret Manager
 * @returns {Promise<string>} - Stripe customer ID
 */
const getOrCreateStripeCustomer = async (latertotsUserId, secretKey) => {
  const stripe = new Stripe(secretKey);
  
  try {
    // Check existing customer
    const userDoc = await db.collection('Users').doc(latertotsUserId).get();
    const existingCustomerId = userDoc.data()?.stripeCustomerId;
    
    if (existingCustomerId) {
      logger.info('🔍 [CUSTOMER] Found existing Stripe customer:', {
        latertotsUserId,
        stripeCustomerId: existingCustomerId
      });
      return existingCustomerId;
    }
    
    // Create new customer
    const customer = await stripe.customers.create({
      email: userDoc.data()?.Email,
      name: userDoc.data()?.Name,
      phone: userDoc.data()?.CellNumber,
      address: {
        line1: userDoc.data()?.StreetAddress,
        city: userDoc.data()?.City,
        state: userDoc.data()?.State,
        postal_code: userDoc.data()?.Zip,
        country: 'US'
      },
      metadata: { 
        [STRIPE_METADATA_KEYS.APP_USER_ID]: `Users/${latertotsUserId}` 
      }
    });
    
    // Save to user record
    await db.collection('Users').doc(latertotsUserId).update({
      stripeCustomerId: customer.id
    });
    
    logger.info('✅ [CUSTOMER] Created new Stripe customer:', {
      latertotsUserId,
      stripeCustomerId: customer.id
    });
    
    return customer.id;
  } catch (error) {
    logger.error('❌ [CUSTOMER] Failed to get or create Stripe customer:', {
      latertotsUserId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Update user's saved payment methods
 * @param {string} latertotsUserId - The app user ID
 * @param {string} paymentMethodId - Stripe payment method ID
 * @returns {Promise<void>}
 */
const updateUserPaymentMethods = async (latertotsUserId, paymentMethodId) => {
  try {
    // Save payment method reference to user record
    await db.collection('Users').doc(latertotsUserId).update({
      savedPaymentMethods: FieldValue.arrayUnion({
        id: paymentMethodId,
        savedAt: Timestamp.now()
      })
    });
    
    logger.info('✅ [CUSTOMER] Updated user payment methods:', {
      latertotsUserId,
      paymentMethodId
    });
  } catch (error) {
    logger.error('❌ [CUSTOMER] Failed to update user payment methods:', {
      latertotsUserId,
      paymentMethodId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Get Stripe customer ID for an app user
 * @param {string} latertotsUserId - The app user ID
 * @returns {Promise<string|null>} - Stripe customer ID or null if not found
 */
const getStripeCustomer = async (latertotsUserId) => {
  try {
    const userDoc = await db.collection('Users').doc(latertotsUserId).get();
    return userDoc.data()?.stripeCustomerId || null;
  } catch (error) {
    logger.error('❌ [CUSTOMER] Failed to get Stripe customer:', {
      latertotsUserId,
      error: error.message
    });
    throw error;
  }
};

module.exports = {
  getOrCreateStripeCustomer,
  updateUserPaymentMethods,
  getStripeCustomer
};
