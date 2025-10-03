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
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');
const logger = require('firebase-functions/logger');
// Legacy constants removed - using StripeEvents only

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
    // Initialize Stripe with the real secret key
    const stripe = require('stripe')(secretKey);
    
    // Only the webhook secret is needed for signature verification
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    return event;
  } catch (error) {
    logger.error('❌ [WEBHOOK] Signature verification failed:', {
      error: error.message
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
      case 'charge.succeeded':
        result = await handleChargeSucceeded(stripeEvent);
        break;
      case 'charge.failed':
        result = await handleChargeFailed(stripeEvent);
        break;
      case 'charge.refunded':
        result = await handleChargeRefunded(stripeEvent);
        break;
      case 'charge.dispute.created':
        result = await handleDisputeCreated(stripeEvent);
        break;
      case 'customer.created':
        result = await handleCustomerCreated(stripeEvent);
        break;
      case 'customer.updated':
        result = await handleCustomerUpdated(stripeEvent);
        break;
      case 'customer.deleted':
        result = await handleCustomerDeleted(stripeEvent);
        break;
      case 'payment_method.attached':
        result = await handlePaymentMethodAttached(stripeEvent);
        break;
      case 'payment_method.detached':
        result = await handlePaymentMethodDetached(stripeEvent);
        break;
      case 'checkout.session.completed':
        result = await handleCheckoutSessionCompleted(stripeEvent);
        break;
      case 'checkout.session.expired':
        result = await handleCheckoutSessionExpired(stripeEvent);
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
 * Handle successful payment (legacy - logging only)
 * @param {Object} stripeEvent - Stripe webhook event
 * @returns {Promise<Object>} - Processing result
 */
const handlePaymentSuccess = async (stripeEvent) => {
  const paymentIntentId = stripeEvent.data.object.id;
  
  logger.info('✅ [WEBHOOK] Payment succeeded (legacy):', {
    paymentIntentId,
    amount: stripeEvent.data.object.amount
  });
  
  return { processed: true, status: 'payment_succeeded_legacy' };
};

/**
 * Handle failed payment (legacy - logging only)
 * @param {Object} stripeEvent - Stripe webhook event
 * @returns {Promise<Object>} - Processing result
 */
const handlePaymentFailure = async (stripeEvent) => {
  const paymentIntentId = stripeEvent.data.object.id;
  const failureReason = stripeEvent.data.object.last_payment_error?.message || 'Unknown error';
  
  logger.info('❌ [WEBHOOK] Payment failed (legacy):', {
    paymentIntentId,
    failureReason
  });
  
  return { processed: true, status: 'payment_failed_legacy', failureReason };
};

/**
 * Handle canceled payment (legacy - logging only)
 * @param {Object} stripeEvent - Stripe webhook event
 * @returns {Promise<Object>} - Processing result
 */
const handlePaymentCanceled = async (stripeEvent) => {
  const paymentIntentId = stripeEvent.data.object.id;
  
  logger.info('🚫 [WEBHOOK] Payment canceled (legacy):', {
    paymentIntentId
  });
  
  return { processed: true, status: 'payment_canceled_legacy' };
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
 * Handle checkout session completed
 * @param {Object} stripeEvent - Stripe webhook event
 * @returns {Promise<Object>} - Processing result
 */
const handleCheckoutSessionCompleted = async (stripeEvent) => {
  const session = stripeEvent.data.object;
  
  try {
    logger.info('✅ [WEBHOOK] Checkout session completed:', {
      sessionId: session.id,
      customerId: session.customer,
      amountTotal: session.amount_total
    });
    
    // Parse reservation data from metadata
    const reservations = JSON.parse(session.metadata.reservationIds || '[]');
    const paymentType = session.metadata.paymentType;
    const appUserId = session.metadata.appUserId;
    
    // Extract user ID from appUserId (format: "Users/{userId}")
    const userId = appUserId.split('/')[1];
    
    // Update reservations with payment information
    const batch = db.batch();
    for (const reservationPath of reservations) {
      const reservationId = reservationPath.split('/')[1];
      const reservationRef = db.collection('Reservations').doc(reservationId);
      
      // Update stripePayments based on payment type
      const stripePayments = {
        minimum: paymentType === 'minimum' ? session.payment_intent : null,
        remainder: paymentType === 'minimum' ? null : null,
        full: paymentType === 'full' ? session.payment_intent : null
      };
      
      batch.update(reservationRef, {
        stripePayments,
        status: 'confirmed', // Update status from PENDING to CONFIRMED
        'extendedProps.status': 'confirmed', // Update extendedProps status as well
        formDraftId: FieldValue.delete(), // Remove formDraftId
        updatedAt: Timestamp.now()
      });
    }
    
    await batch.commit();
    
    // Delete the form draft
    const formDraftRef = db.collection('FormDrafts').doc(userId);
    await formDraftRef.delete();
    
    // Update user's saved payment methods if any
    if (session.payment_method) {
      const { updateUserPaymentMethods } = require('./customerHelpers');
      await updateUserPaymentMethods(appUserId, session.payment_method);
    }
    
    logger.info('✅ [WEBHOOK] Checkout session processing completed:', {
      sessionId: session.id,
      userId,
      reservationCount: reservations.length,
      paymentType
    });
    
    return { processed: true, userId, reservationCount: reservations.length, status: 'checkout_completed' };
    
  } catch (error) {
    logger.error('❌ [WEBHOOK] Failed to process checkout session completion:', {
      sessionId: session.id,
      error: error.message
    });
    throw error;
  }
};

/**
 * Handle checkout session expired
 * @param {Object} stripeEvent - Stripe webhook event
 * @returns {Promise<Object>} - Processing result
 */
const handleCheckoutSessionExpired = async (stripeEvent) => {
  const session = stripeEvent.data.object;
  
  try {
    logger.info('⏰ [WEBHOOK] Checkout session expired:', {
      sessionId: session.id,
      customerId: session.customer
    });
    
    // Extract user ID from session metadata
    const appUserId = session.metadata?.appUserId;
    if (appUserId) {
      const userId = appUserId.split('/')[1]; // Extract from "Users/{userId}" format
      
      // Clean up the user's form draft and associated reservations
      const { performCleanup } = require('../../cleanup/cleanupFailedReservations');
      const cleanupResult = await performCleanup({ 
        specificDraftId: userId,
        userId: userId 
      });
      
      logger.info('🧹 [WEBHOOK] Cleaned up expired checkout session:', {
        sessionId: session.id,
        userId,
        cleanupResult
      });
    } else {
      logger.warn('⚠️ [WEBHOOK] No appUserId found in expired session metadata:', {
        sessionId: session.id,
        metadata: session.metadata
      });
    }
    
    return { processed: true, status: 'checkout_expired' };
    
  } catch (error) {
    logger.error('❌ [WEBHOOK] Failed to process expired checkout session:', {
      sessionId: session.id,
      error: error.message
    });
    throw error;
  }
};

// Legacy invoice creation function removed

/**
 * Create reservations in Firestore from checkout session
 * @param {Array} reservations - Reservation data
 * @param {string} stripeCustomerId - Stripe customer ID
 * @param {string} appUserId - App user ID
 * @returns {Promise<void>}
 */
const createReservationsFromCheckout = async (reservations, stripeCustomerId, appUserId) => {
  const batch = db.batch();
  
  reservations.forEach(reservation => {
    const reservationRef = db.collection('Reservations').doc(reservation.id);
    batch.set(reservationRef, {
      ...reservation,
      stripeCustomerId: stripeCustomerId,
      appUserId: appUserId,
      status: 'confirmed',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  });
  
  await batch.commit();
  
  logger.info('✅ [WEBHOOK] Created reservations from checkout:', {
    reservationCount: reservations.length,
    stripeCustomerId
  });
};

/**
 * Handle charge succeeded
 * @param {Object} stripeEvent - Stripe webhook event
 * @returns {Promise<Object>} - Processing result
 */
const handleChargeSucceeded = async (stripeEvent) => {
  const charge = stripeEvent.data.object;
  
  logger.info('✅ [WEBHOOK] Charge succeeded:', {
    chargeId: charge.id,
    customerId: charge.customer,
    amount: charge.amount,
    currency: charge.currency
  });
  
  // Legacy observability removed - using StripeEvents only
  
  return { processed: true, chargeId: charge.id, status: 'charge_succeeded' };
};

/**
 * Handle charge failed
 * @param {Object} stripeEvent - Stripe webhook event
 * @returns {Promise<Object>} - Processing result
 */
const handleChargeFailed = async (stripeEvent) => {
  const charge = stripeEvent.data.object;
  const failureCode = charge.failure_code;
  const failureMessage = charge.failure_message;
  
  logger.info('❌ [WEBHOOK] Charge failed:', {
    chargeId: charge.id,
    customerId: charge.customer,
    amount: charge.amount,
    failureCode,
    failureMessage
  });
  
  // Legacy observability removed - using StripeEvents only
  
  return { processed: true, chargeId: charge.id, status: 'charge_failed', failureCode, failureMessage };
};

/**
 * Handle charge refunded
 * @param {Object} stripeEvent - Stripe webhook event
 * @returns {Promise<Object>} - Processing result
 */
const handleChargeRefunded = async (stripeEvent) => {
  const charge = stripeEvent.data.object;
  
  logger.info('💰 [WEBHOOK] Charge refunded:', {
    chargeId: charge.id,
    customerId: charge.customer,
    amount: charge.amount,
    refunded: charge.refunded
  });
  
  // Legacy observability removed - using StripeEvents only
  
  return { processed: true, chargeId: charge.id, status: 'charge_refunded' };
};

/**
 * Handle customer created
 * @param {Object} stripeEvent - Stripe webhook event
 * @returns {Promise<Object>} - Processing result
 */
const handleCustomerCreated = async (stripeEvent) => {
  const customer = stripeEvent.data.object;
  
  logger.info('👤 [WEBHOOK] Customer created:', {
    customerId: customer.id,
    email: customer.email
  });
  
  // If metadata includes appUserId, save Stripe customer ID to user doc
  if (customer.metadata?.appUserId) {
    const appUserId = customer.metadata.appUserId;
    const userId = appUserId.split('/')[1];
    
    await db.collection('Users').doc(userId).update({
      stripeCustomerId: customer.id,
      updatedAt: Timestamp.now()
    });
    
    // Sync payment methods
    const { updateUserPaymentMethods } = require('./customerHelpers');
    await updateUserPaymentMethods(appUserId, customer.id);
  }
  
  return { processed: true, customerId: customer.id, status: 'customer_created' };
};

/**
 * Handle customer updated
 * @param {Object} stripeEvent - Stripe webhook event
 * @returns {Promise<Object>} - Processing result
 */
const handleCustomerUpdated = async (stripeEvent) => {
  const customer = stripeEvent.data.object;
  
  logger.info('👤 [WEBHOOK] Customer updated:', {
    customerId: customer.id,
    email: customer.email
  });
  
  // If metadata includes appUserId, ensure Stripe customer ID is saved and sync payment methods
  if (customer.metadata?.appUserId) {
    const appUserId = customer.metadata.appUserId;
    const userId = appUserId.split('/')[1];
    
    await db.collection('Users').doc(userId).update({
      stripeCustomerId: customer.id,
      updatedAt: Timestamp.now()
    });
    
    // Sync payment methods
    const { updateUserPaymentMethods } = require('./customerHelpers');
    await updateUserPaymentMethods(appUserId, customer.id);
  }
  
  return { processed: true, customerId: customer.id, status: 'customer_updated' };
};

/**
 * Handle customer deleted
 * @param {Object} stripeEvent - Stripe webhook event
 * @returns {Promise<Object>} - Processing result
 */
const handleCustomerDeleted = async (stripeEvent) => {
  const customer = stripeEvent.data.object;
  
  logger.info('👤 [WEBHOOK] Customer deleted:', {
    customerId: customer.id
  });
  
  // If metadata includes appUserId, mark Stripe linkage as removed
  if (customer.metadata?.appUserId) {
    const appUserId = customer.metadata.appUserId;
    const userId = appUserId.split('/')[1];
    
    await db.collection('Users').doc(userId).update({
      stripeCustomerId: null,
      updatedAt: Timestamp.now()
    });
    
    // Clear cached payment methods
    await db.collection('Users').doc(userId).collection('PaymentMethods').get().then(snapshot => {
      const batch = db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      return batch.commit();
    });
  }
  
  return { processed: true, customerId: customer.id, status: 'customer_deleted' };
};

/**
 * Handle payment method attached
 * @param {Object} stripeEvent - Stripe webhook event
 * @returns {Promise<Object>} - Processing result
 */
const handlePaymentMethodAttached = async (stripeEvent) => {
  const paymentMethod = stripeEvent.data.object;
  
  logger.info('💳 [WEBHOOK] Payment method attached:', {
    paymentMethodId: paymentMethod.id,
    customerId: paymentMethod.customer
  });
  
  // Sync payment methods for the customer
  const { updateUserPaymentMethods } = require('./customerHelpers');
  await updateUserPaymentMethods(`Users/${paymentMethod.customer}`, paymentMethod.customer);
  
  return { processed: true, paymentMethodId: paymentMethod.id, status: 'payment_method_attached' };
};

/**
 * Handle payment method detached
 * @param {Object} stripeEvent - Stripe webhook event
 * @returns {Promise<Object>} - Processing result
 */
const handlePaymentMethodDetached = async (stripeEvent) => {
  const paymentMethod = stripeEvent.data.object;
  
  logger.info('💳 [WEBHOOK] Payment method detached:', {
    paymentMethodId: paymentMethod.id,
    customerId: paymentMethod.customer
  });
  
  // Sync payment methods for the customer
  const { updateUserPaymentMethods } = require('./customerHelpers');
  await updateUserPaymentMethods(`Users/${paymentMethod.customer}`, paymentMethod.customer);
  
  return { processed: true, paymentMethodId: paymentMethod.id, status: 'payment_method_detached' };
};

module.exports = {
  verifyWebhookSignature,
  processStripeWebhook,
  handlePaymentSuccess,
  handlePaymentFailure,
  handlePaymentCanceled,
  handleChargeSucceeded,
  handleChargeFailed,
  handleChargeRefunded,
  handleDisputeCreated,
  handleCustomerCreated,
  handleCustomerUpdated,
  handleCustomerDeleted,
  handlePaymentMethodAttached,
  handlePaymentMethodDetached,
  handleCheckoutSessionCompleted,
  handleCheckoutSessionExpired
};
