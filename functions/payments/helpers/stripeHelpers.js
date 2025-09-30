// stripeHelpers.js - Stripe API interaction helpers
const admin = require('firebase-admin');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const logger = require('firebase-functions/logger');
const { PAYMENT_ACTIVITY_TYPES, PAYMENT_ACTIVITY_STATUS, STRIPE } = require('../../constants');
const Stripe = require('stripe');

const db = getFirestore();

// Initialize Stripe with secret key from parameterized configuration
// Note: This will be initialized when the function is called with the secret bound
let stripe = null;

/**
 * Initialize Stripe with secret key from parameterized configuration
 * @param {string} secretKey - Stripe secret key from Secret Manager
 * @returns {Stripe} - Initialized Stripe instance
 */
const initializeStripe = (secretKey) => {
  if (!stripe) {
    stripe = new Stripe(secretKey, {
      apiVersion: STRIPE.API_VERSION,
    });
  }
  return stripe;
};

/**
 * Create a Stripe Payment Intent for an invoice
 * @param {string} invoiceId - The invoice ID
 * @param {Object} paymentMethod - Payment method details
 * @param {string} secretKey - Stripe secret key from Secret Manager
 * @returns {Promise<Object>} - Payment Intent creation result
 */
const createPaymentIntent = async (invoiceId, paymentMethod, secretKey) => {
  try {
    // Initialize Stripe with secret key
    const stripeClient = initializeStripe(secretKey);
    
    // Get invoice details
    const invoiceDoc = await db.collection('Invoices').doc(invoiceId).get();
    if (!invoiceDoc.exists) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }
    
    const invoice = invoiceDoc.data();
    
    // Create or get Stripe customer
    let customerId = paymentMethod?.customerId;
    if (!customerId) {
      const customer = await stripeClient.customers.create({
        email: invoice.user.email,
        name: invoice.user.name,
        phone: invoice.user.phone,
        metadata: {
          invoiceId: invoiceId,
          userId: invoice.user.id
        }
      });
      customerId = customer.id;
    }
    
    // Create Stripe Payment Intent
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: invoice.totalCents,
      currency: 'usd',
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        invoiceId: invoiceId,
        userId: invoice.user.id,
        reservationId: invoice.reservationId
      },
      description: `Payment for invoice ${invoiceId}`,
      receipt_email: invoice.user.email
    });
    
    logger.info('💳 [PAYMENT] Created Payment Intent:', {
      invoiceId,
      paymentIntentId: paymentIntent.id,
      amount: invoice.totalCents,
      customerId: customerId
    });
    
    return paymentIntent;
  } catch (error) {
    logger.error('❌ [PAYMENT] Failed to create Payment Intent:', {
      invoiceId,
      error: error.message,
      stripeError: error.type,
      stripeCode: error.code
    });
    throw error;
  }
};

/**
 * Process a refund through Stripe
 * @param {string} invoiceId - The invoice ID
 * @param {number} amountCents - Refund amount in cents
 * @param {string} reason - Refund reason
 * @param {string} secretKey - Stripe secret key from Secret Manager
 * @returns {Promise<Object>} - Refund result
 */
const processRefund = async (invoiceId, amountCents, reason, secretKey) => {
  try {
    // Initialize Stripe with secret key
    const stripeClient = initializeStripe(secretKey);
    
    // Get invoice and payment activity
    const invoiceDoc = await db.collection('Invoices').doc(invoiceId).get();
    if (!invoiceDoc.exists) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }
    
    const invoice = invoiceDoc.data();
    
    // Find successful payment activity
    const paymentActivities = await db
      .collection('Invoices')
      .doc(invoiceId)
      .collection('PaymentActivities')
      .where('status', '==', PAYMENT_ACTIVITY_STATUS.SUCCESS)
      .get();
    
    if (paymentActivities.empty) {
      throw new Error(`No successful payment found for invoice ${invoiceId}`);
    }
    
    const successfulPayment = paymentActivities.docs[0].data();
    
    // Create Stripe refund
    const refund = await stripeClient.refunds.create({
      payment_intent: successfulPayment.stripePaymentIntentId,
      amount: amountCents,
      reason: reason,
      metadata: {
        invoiceId: invoiceId,
        userId: invoice.user.id,
        reservationId: invoice.reservationId
      }
    });
    
    logger.info('💰 [PAYMENT] Processed refund:', {
      invoiceId,
      refundId: refund.id,
      amount: amountCents,
      reason
    });
    
    return refund;
  } catch (error) {
    logger.error('❌ [PAYMENT] Failed to process refund:', {
      invoiceId,
      error: error.message,
      stripeError: error.type,
      stripeCode: error.code
    });
    throw error;
  }
};

/**
 * Cancel a pending Payment Intent
 * @param {string} paymentIntentId - Stripe Payment Intent ID
 * @param {string} secretKey - Stripe secret key from Secret Manager
 * @returns {Promise<Object>} - Cancellation result
 */
const cancelPaymentIntent = async (paymentIntentId, secretKey) => {
  try {
    // Initialize Stripe with secret key
    const stripeClient = initializeStripe(secretKey);
    
    // Cancel Stripe Payment Intent
    const result = await stripeClient.paymentIntents.cancel(paymentIntentId);
    
    logger.info('🚫 [PAYMENT] Canceled Payment Intent:', {
      paymentIntentId
    });
    
    return result;
  } catch (error) {
    logger.error('❌ [PAYMENT] Failed to cancel Payment Intent:', {
      paymentIntentId,
      error: error.message,
      stripeError: error.type,
      stripeCode: error.code
    });
    throw error;
  }
};

module.exports = {
  createPaymentIntent,
  processRefund,
  cancelPaymentIntent
};
