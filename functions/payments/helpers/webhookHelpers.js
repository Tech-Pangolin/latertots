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
      logger.debug('🔄 [processStripeWebhook] Event already processed:', {
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
      // Events that are logged but not processed - stored in StripeEvents collection only
      case 'payment_intent.succeeded':
      case 'payment_intent.payment_failed':
      case 'payment_intent.canceled':
      case 'charge.succeeded':
      case 'charge.failed':
      case 'charge.refunded':
        logger.debug('📝 [processStripeWebhook] Event logged (no processing):', {
          eventType: stripeEvent.type,
          stripeEventId: stripeEvent.id
        });
        result = { processed: true, reason: 'logged_only' };
        break;

      // Events with active business logic
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
        logger.debug('ℹ️ [processStripeWebhook] Unhandled event type:', {
          eventType: stripeEvent.type,
          stripeEventId: stripeEvent.id
        });
        result = { processed: true, reason: 'unhandled_event_type' };
    }

    logger.debug('✅ [processStripeWebhook] Processed Stripe event:', {
      stripeEventId: stripeEvent.id,
      eventType: stripeEvent.type,
      result
    });

    return result;
  } catch (error) {
    logger.error('❌ [processStripeWebhook] Failed to process Stripe event:', {
      stripeEventId: stripeEvent.id,
      eventType: stripeEvent.type,
      error: error.message
    });
    throw error;
  }
};


/**
 * Handle dispute created
 * @param {Object} stripeEvent - Stripe webhook event
 * @returns {Promise<Object>} - Processing result
 */
const handleDisputeCreated = async (stripeEvent) => {
  const disputeId = stripeEvent.data.object.id;
  const chargeId = stripeEvent.data.object.charge;

  logger.info('⚖️ [handleDisputeCreated] Dispute created:', {
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
    // Parse reservation data from metadata
    const reservations = JSON.parse(session.metadata.reservationIds || '[]');
    const paymentType = session.metadata.paymentType;
    const appUserId = session.metadata.appUserId;
    const isRemainderPayment = paymentType === 'remainder';

    // Extract user ID from appUserId (format: "Users/{userId}")
    const userId = appUserId.split('/')[1];

    // Update reservations with payment information
    const batch = db.batch();
    for (const reservationPath of reservations) {
      const reservationId = reservationPath.split('/')[1];
      const reservationRef = db.collection('Reservations').doc(reservationId);

      // Build update object with field-level updates to preserve existing data
      const updateData = {
        status: isRemainderPayment ? 'paid' : 'confirmed',
        updatedAt: Timestamp.now()
      };
      
      // Update specific payment field based on payment type
      if (paymentType === 'minimum') {
        updateData['stripePayments.minimum'] = session.payment_intent;
      } else if (paymentType === 'full') {
        updateData['stripePayments.full'] = session.payment_intent;
      } else if (paymentType === 'remainder') {
        updateData['stripePayments.remainder'] = session.payment_intent;
      }
      
      // Only delete formDraftId for non-remainder payments
      if (!isRemainderPayment) {
        updateData.formDraftId = FieldValue.delete();
      }
      
      batch.update(reservationRef, updateData);
    }

    await batch.commit();

    // Only perform cleanup for non-remainder payments
    if (!isRemainderPayment) {
      const { performCleanup } = require('../../cleanup/cleanupFailedReservations');
      await performCleanup({ specificDraftId: userId, userId });
    }

    // Update user's saved payment methods if any
    if (session.payment_method) {
      const { updateUserPaymentMethods } = require('./customerHelpers');
      await updateUserPaymentMethods(appUserId, session.payment_method);
    }

    logger.info('✅ [handleCheckoutSessionCompleted] Checkout session processing completed:', {
      sessionId: session.id,
      userId,
      reservationCount: reservations.length,
      paymentType,
      customerId: session.customer,
      amountTotal: session.amount_total
    });

    return { processed: true, userId, reservationCount: reservations.length, status: 'checkout_completed' };

  } catch (error) {
    logger.error('❌ [handleCheckoutSessionCompleted] Failed to process checkout session completion:', {
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
    // Extract user ID from session metadata
    const appUserId = session.metadata?.appUserId;
    const paymentType = session.metadata?.paymentType;
    const isRemainderPayment = paymentType === 'remainder';
    
    if (appUserId && !isRemainderPayment) {
      const userId = appUserId.split('/')[1]; // Extract from "Users/{userId}" format

      // Clean up the user's form draft and associated reservations
      const { performCleanup } = require('../../cleanup/cleanupFailedReservations');
      const cleanupResult = await performCleanup({
        specificDraftId: userId,
        userId: userId
      });

      logger.info('⏰ [handleCheckoutSessionExpired] Cleaned up expired checkout session:', {
        sessionId: session.id,
        userId,
        cleanupResult
      });
    } else if (appUserId && isRemainderPayment) {
      logger.info('⏰ [handleCheckoutSessionExpired] Skipped cleanup for remainder payment:', {
        sessionId: session.id,
        paymentType
      });
    } else {
      logger.warn('⚠️ [handleCheckoutSessionExpired] No appUserId found in expired session metadata:', {
        sessionId: session.id,
        metadata: session.metadata
      });
    }

    return { processed: true, status: 'checkout_expired' };

  } catch (error) {
    logger.error('❌ [handleCheckoutSessionExpired] Failed to process expired checkout session:', {
      sessionId: session.id,
      error: error.message
    });
    throw error;
  }
};

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
 * Handle customer created
 * @param {Object} stripeEvent - Stripe webhook event
 * @returns {Promise<Object>} - Processing result
 */
const handleCustomerCreated = async (stripeEvent) => {
  const customer = stripeEvent.data.object;


  // If metadata includes appUserId, save Stripe customer ID to user doc
  if (customer.metadata?.appUserId) {
    const appUserId = customer.metadata.appUserId;

    // Handle both formats: "Users/abc123" or just "abc123"
    let userId;
    if (appUserId.includes('Users/')) {
      // Full path format: "Users/abc123" -> extract "abc123"
      userId = appUserId.split('/')[1];
    } else {
      // Just UID format: "abc123" -> use as-is
      userId = appUserId;
    }

    // Validate we have a valid userId
    if (!userId || userId.trim() === '') {
      logger.error('❌ [handleCustomerCreated] Invalid appUserId format:', {
        appUserId,
        customerId: customer.id
      });
      return { processed: false, error: 'Invalid appUserId format' };
    }

    await db.collection('Users').doc(userId).update({
      stripeCustomerId: customer.id,
      updatedAt: Timestamp.now()
    });

    // Sync payment methods - pass userId, not appUserId
    const { updateUserPaymentMethods } = require('./customerHelpers');
    await updateUserPaymentMethods(userId, customer.id);
  }

  logger.info('👤 [handleCustomerCreated] Customer created:', {
    customerId: customer.id,
    email: customer.email
  });


  return { processed: true, customerId: customer.id, status: 'customer_created' };
};

/**
 * Handle customer updated
 * @param {Object} stripeEvent - Stripe webhook event
 * @returns {Promise<Object>} - Processing result
 */
const handleCustomerUpdated = async (stripeEvent) => {
  const customer = stripeEvent.data.object;

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

  logger.info('👤 [handleCustomerUpdated] Customer updated:', {
    customerId: customer.id,
    email: customer.email
  });

  return { processed: true, customerId: customer.id, status: 'customer_updated' };
};

/**
 * Handle customer deleted
 * @param {Object} stripeEvent - Stripe webhook event
 * @returns {Promise<Object>} - Processing result
 */
const handleCustomerDeleted = async (stripeEvent) => {
  const customer = stripeEvent.data.object;

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
 
  logger.info('👤 [handleCustomerDeleted] Customer deleted:', {
    customerId: customer.id
  });

  return { processed: true, customerId: customer.id, status: 'customer_deleted' };
};

/**
 * Handle payment method attached
 * @param {Object} stripeEvent - Stripe webhook event
 * @returns {Promise<Object>} - Processing result
 */
const handlePaymentMethodAttached = async (stripeEvent) => {
  const paymentMethod = stripeEvent.data.object;

  try {
    // Find the user by Stripe customer ID
    const usersQuery = await db.collection('Users')
      .where('stripeCustomerId', '==', paymentMethod.customer)
      .limit(1)
      .get();

    if (usersQuery.empty) {
      logger.warn('⚠️ [WEBHOOK] No user found for Stripe customer:', {
        customerId: paymentMethod.customer,
        paymentMethodId: paymentMethod.id
      });
      return { processed: false, reason: 'user_not_found' };
    }

    const userDoc = usersQuery.docs[0];
    const userId = userDoc.id;

    // Sync payment methods for the user
    const { updateUserPaymentMethods } = require('./customerHelpers');
    await updateUserPaymentMethods(userId, paymentMethod.id);

    logger.info('💳 [handlePaymentMethodAttached] Payment method attached:', {
      paymentMethodId: paymentMethod.id,
      customerId: paymentMethod.customer
    });

    return { processed: true, paymentMethodId: paymentMethod.id, userId, status: 'payment_method_attached' };
  } catch (error) {
    logger.error('❌ [handlePaymentMethodAttached] Failed to handle payment method attached:', {
      paymentMethodId: paymentMethod.id,
      customerId: paymentMethod.customer,
      error: error.message
    });
    throw error;
  }
};

/**
 * Handle payment method detached
 * @param {Object} stripeEvent - Stripe webhook event
 * @returns {Promise<Object>} - Processing result
 */
const handlePaymentMethodDetached = async (stripeEvent) => {
  const paymentMethod = stripeEvent.data.object;

  try {
    // Find the user by Stripe customer ID
    const usersQuery = await db.collection('Users')
      .where('stripeCustomerId', '==', paymentMethod.customer)
      .limit(1)
      .get();

    if (usersQuery.empty) {
      logger.warn('⚠️ [handlePaymentMethodDetached] No user found for Stripe customer:', {
        customerId: paymentMethod.customer,
        paymentMethodId: paymentMethod.id
      });
      return { processed: false, reason: 'user_not_found' };
    }

    const userDoc = usersQuery.docs[0];
    const userId = userDoc.id;

    // Sync payment methods for the user
    const { updateUserPaymentMethods } = require('./customerHelpers');
    await updateUserPaymentMethods(userId, paymentMethod.id);

    logger.info('💳 [handlePaymentMethodDetached] Payment method detached:', {
      paymentMethodId: paymentMethod.id,
      customerId: paymentMethod.customer
    });

    return { processed: true, paymentMethodId: paymentMethod.id, userId, status: 'payment_method_detached' };
  } catch (error) {
    logger.error('❌ [WEBHOOK] Failed to handle payment method detached:', {
      paymentMethodId: paymentMethod.id,
      customerId: paymentMethod.customer,
      error: error.message
    });
    throw error;
  }
};

module.exports = {
  verifyWebhookSignature,
  processStripeWebhook,
  handleDisputeCreated,
  handleCustomerCreated,
  handleCustomerUpdated,
  handleCustomerDeleted,
  handlePaymentMethodAttached,
  handlePaymentMethodDetached,
  handleCheckoutSessionCompleted,
  handleCheckoutSessionExpired
};
