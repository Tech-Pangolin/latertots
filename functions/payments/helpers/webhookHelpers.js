// webhookHelpers.js - Stripe webhook processing helpers

/*
 * StripeEvents Collection Schema Reference:
 * {
 *   id: string,                          // Auto-generated document ID
 *   stripeEventId: string,              // Stripe's unique event identifier
 *   eventType: string,                  // 'payment_intent.created', 'payment_intent.succeeded', etc.
 *   stripePaymentIntentId: string,      // Stripe Payment Intent ID (if applicable)
 *   stripeCustomerId: string,           // Stripe customer ID (if applicable)
 *   stripeChargeId: string,            // Stripe charge ID (if applicable)
 *   stripeDisputeId: string,           // Stripe dispute ID (if applicable)
 *   stripeRefundId: string,            // Stripe refund ID (if applicable)
 *   timestamp: Timestamp,               // When the Stripe event occurred
 *   data: Object,                       // Full Stripe event payload
 *   createdAt: Timestamp               // When we logged this event
 * }
 */

const admin = require('firebase-admin');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { logger } = require('firebase-functions');
const { PAYMENT_ACTIVITY_TYPES, PAYMENT_ACTIVITY_STATUS } = require('../../constants');
const functions = require('firebase-functions');

const db = getFirestore();

/**
 * Verify Stripe webhook signature for security
 * @param {string} payload - Raw webhook payload
 * @param {string} signature - Stripe signature header
 * @param {string} secretKey - Stripe secret key from Secret Manager
 * @param {string} webhookSecret - Stripe webhook secret from Secret Manager
 * @returns {Object} Verified Stripe event
 */
const verifyWebhookSignature = (payload, signature, secretKey, webhookSecret) => {
  try {
    const stripe = require('stripe')(secretKey);
    
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return event;
  } catch (error) {
    logger.error('❌ [WEBHOOK] Signature verification failed:', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
    throw new Error('Invalid webhook signature');
  }
};

/**
 * Process incoming Stripe webhook events
 * @param {Object} stripeEvent - Stripe webhook event data
 * @returns {Promise<Object>} - Processing result
 */
const processStripeWebhook = async (stripeEvent) => {
  try {
    // Check if we've already processed this event
    const existingEvent = await db
      .collection('StripeEvents')
      .where('stripeEventId', '==', stripeEvent.id)
      .get();
    
    if (!existingEvent.empty) {
      logger.info('🔄 [WEBHOOK] Event already processed:', {
        stripeEventId: stripeEvent.id,
        eventType: stripeEvent.type
      });
      return { processed: true, reason: 'already_processed' };
    }
    
    // Store the Stripe event
    await db.collection('StripeEvents').add({
      stripeEventId: stripeEvent.id,
      eventType: stripeEvent.type,
      stripePaymentIntentId: stripeEvent.data?.object?.id || null,
      stripeCustomerId: stripeEvent.data?.object?.customer || null,
      stripeChargeId: stripeEvent.data?.object?.charge || null,
      stripeDisputeId: stripeEvent.data?.object?.dispute || null,
      stripeRefundId: stripeEvent.data?.object?.refund || null,
      timestamp: Timestamp.fromDate(new Date(stripeEvent.created * 1000)),
      data: stripeEvent,
      createdAt: Timestamp.now()
    });
    
    // Process based on event type
    let result = { processed: false };
    
    switch (stripeEvent.type) {
      case 'payment_intent.succeeded':
        result = await handlePaymentSuccess(stripeEvent);
        break;
      case 'payment_intent.payment_failed':
        result = await handlePaymentFailure(stripeEvent);
        break;
      case 'payment_intent.canceled':
        result = await handlePaymentCanceled(stripeEvent);
        break;
      case 'charge.dispute.created':
        result = await handleDisputeCreated(stripeEvent);
        break;
      case 'invoice.payment_succeeded':
        result = await handleInvoicePaymentSuccess(stripeEvent);
        break;
      case 'invoice.payment_failed':
        result = await handleInvoicePaymentFailure(stripeEvent);
        break;
      default:
        logger.info('ℹ️ [WEBHOOK] Unhandled event type:', {
          eventType: stripeEvent.type,
          stripeEventId: stripeEvent.id
        });
        result = { processed: true, reason: 'unhandled_event_type' };
    }
    
    logger.info('✅ [WEBHOOK] Processed Stripe event:', {
      stripeEventId: stripeEvent.id,
      eventType: stripeEvent.type,
      result
    });
    
    return result;
  } catch (error) {
    logger.error('❌ [WEBHOOK] Failed to process Stripe event:', {
      stripeEventId: stripeEvent.id,
      eventType: stripeEvent.type,
      error: error.message
    });
    throw error;
  }
};

/**
 * Handle successful payment
 * @param {Object} stripeEvent - Stripe webhook event
 * @returns {Promise<Object>} - Processing result
 */
const handlePaymentSuccess = async (stripeEvent) => {
  const paymentIntentId = stripeEvent.data.object.id;
  
  // Find the invoice with this payment intent
  const paymentActivities = await db
    .collectionGroup('PaymentActivities')
    .where('stripePaymentIntentId', '==', paymentIntentId)
    .get();
  
  if (paymentActivities.empty) {
    logger.warn('⚠️ [WEBHOOK] No payment activity found for successful payment:', {
      paymentIntentId
    });
    return { processed: false, reason: 'no_payment_activity_found' };
  }
  
  const paymentActivity = paymentActivities.docs[0];
  const invoiceId = paymentActivity.ref.parent.parent.id;
  
  // Update payment activity status
  await paymentActivity.ref.update({
    status: PAYMENT_ACTIVITY_STATUS.SUCCESS,
    updatedAt: Timestamp.now()
  });
  
  // Update invoice status
  await db.collection('Invoices').doc(invoiceId).update({
    status: 'paid',
    updatedAt: Timestamp.now()
  });
  
  // Update reservation status
  const invoiceDoc = await db.collection('Invoices').doc(invoiceId).get();
  const invoice = invoiceDoc.data();
  if (invoice.reservationId) {
    await db.collection('Reservations').doc(invoice.reservationId).update({
      status: 'completed',
      updatedAt: Timestamp.now()
    });
  }
  
  logger.info('✅ [WEBHOOK] Payment succeeded:', {
    invoiceId,
    paymentIntentId,
    amount: stripeEvent.data.object.amount
  });
  
  return { processed: true, invoiceId, status: 'paid' };
};

/**
 * Handle failed payment
 * @param {Object} stripeEvent - Stripe webhook event
 * @returns {Promise<Object>} - Processing result
 */
const handlePaymentFailure = async (stripeEvent) => {
  const paymentIntentId = stripeEvent.data.object.id;
  const failureReason = stripeEvent.data.object.last_payment_error?.message || 'Unknown error';
  
  // Find the invoice with this payment intent
  const paymentActivities = await db
    .collectionGroup('PaymentActivities')
    .where('stripePaymentIntentId', '==', paymentIntentId)
    .get();
  
  if (paymentActivities.empty) {
    logger.warn('⚠️ [WEBHOOK] No payment activity found for failed payment:', {
      paymentIntentId
    });
    return { processed: false, reason: 'no_payment_activity_found' };
  }
  
  const paymentActivity = paymentActivities.docs[0];
  const invoiceId = paymentActivity.ref.parent.parent.id;
  
  // Update payment activity status
  await paymentActivity.ref.update({
    status: PAYMENT_ACTIVITY_STATUS.FAILED,
    failureReason: failureReason,
    updatedAt: Timestamp.now()
  });
  
  logger.info('❌ [WEBHOOK] Payment failed:', {
    invoiceId,
    paymentIntentId,
    failureReason
  });
  
  return { processed: true, invoiceId, status: 'failed', failureReason };
};

/**
 * Handle canceled payment
 * @param {Object} stripeEvent - Stripe webhook event
 * @returns {Promise<Object>} - Processing result
 */
const handlePaymentCanceled = async (stripeEvent) => {
  const paymentIntentId = stripeEvent.data.object.id;
  
  // Find the invoice with this payment intent
  const paymentActivities = await db
    .collectionGroup('PaymentActivities')
    .where('stripePaymentIntentId', '==', paymentIntentId)
    .get();
  
  if (paymentActivities.empty) {
    logger.warn('⚠️ [WEBHOOK] No payment activity found for canceled payment:', {
      paymentIntentId
    });
    return { processed: false, reason: 'no_payment_activity_found' };
  }
  
  const paymentActivity = paymentActivities.docs[0];
  const invoiceId = paymentActivity.ref.parent.parent.id;
  
  // Update payment activity status
  await paymentActivity.ref.update({
    status: PAYMENT_ACTIVITY_STATUS.CANCELLED,
    updatedAt: Timestamp.now()
  });
  
  logger.info('🚫 [WEBHOOK] Payment canceled:', {
    invoiceId,
    paymentIntentId
  });
  
  return { processed: true, invoiceId, status: 'canceled' };
};

/**
 * Handle dispute created
 * @param {Object} stripeEvent - Stripe webhook event
 * @returns {Promise<Object>} - Processing result
 */
const handleDisputeCreated = async (stripeEvent) => {
  const disputeId = stripeEvent.data.object.id;
  const chargeId = stripeEvent.data.object.charge;
  
  logger.info('⚖️ [WEBHOOK] Dispute created:', {
    disputeId,
    chargeId
  });
  
  // TODO: Implement dispute handling logic
  return { processed: true, disputeId, status: 'dispute_created' };
};

/**
 * Handle invoice payment success
 * @param {Object} stripeEvent - Stripe webhook event
 * @returns {Promise<Object>} - Processing result
 */
const handleInvoicePaymentSuccess = async (stripeEvent) => {
  logger.info('✅ [WEBHOOK] Invoice payment succeeded:', {
    invoiceId: stripeEvent.data.object.id
  });
  
  return { processed: true, status: 'invoice_payment_succeeded' };
};

/**
 * Handle invoice payment failure
 * @param {Object} stripeEvent - Stripe webhook event
 * @returns {Promise<Object>} - Processing result
 */
const handleInvoicePaymentFailure = async (stripeEvent) => {
  logger.info('❌ [WEBHOOK] Invoice payment failed:', {
    invoiceId: stripeEvent.data.object.id
  });
  
  return { processed: true, status: 'invoice_payment_failed' };
};

module.exports = {
  verifyWebhookSignature,
  processStripeWebhook,
  handlePaymentSuccess,
  handlePaymentFailure,
  handlePaymentCanceled,
  handleDisputeCreated,
  handleInvoicePaymentSuccess,
  handleInvoicePaymentFailure
};
