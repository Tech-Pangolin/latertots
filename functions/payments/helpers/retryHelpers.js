// retryHelpers.js - Payment retry logic helpers

/*
 * PaymentActivities Subcollection Schema Reference:
 * // Invoices/{invoiceId}/PaymentActivities/{activityId}
 * {
 *   id: string,                          // Auto-generated activity ID
 *   invoiceId: string,                  // Parent invoice ID
 *   activityType: string,               // 'PAYMENT_ATTEMPT', 'RETRY', 'REFUND', 'DISPUTE'
 *   stripePaymentIntentId: string,      // Stripe Payment Intent ID
 *   stripeEventId: string,              // Related Stripe event ID
 *   status: string,                     // 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'
 *   amountCents: number,                // Amount in cents
 *   paymentMethod: string,              // 'card', 'bank_transfer', etc.
 *   failureReason: string,              // Why payment failed (if applicable)
 *   retryCount: number,                 // Number of retry attempts
 *   createdAt: Timestamp,               // When activity was created
 *   updatedAt: Timestamp,               // When activity was last updated
 *   metadata: Object,                   // Additional context data
 *   previousActivityId: string          // Link to previous activity (for retries)
 * }
 */

const admin = require('firebase-admin');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const logger = require('firebase-functions/logger');
const { PAYMENT_CONFIG, PAYMENT_ACTIVITY_TYPES, PAYMENT_ACTIVITY_STATUS } = require('../../constants');

const db = getFirestore();

/**
 * Find invoices that need payment attempts
 * @returns {Promise<Array>} - Array of invoices needing payment
 */
const findInvoicesNeedingPayment = async () => {
  try {
    // Find unpaid invoices
    const unpaidInvoices = await db
      .collection('Invoices')
      .where('status', '==', 'unpaid')
      .get();
    
    const invoicesNeedingPayment = [];
    
    for (const invoiceDoc of unpaidInvoices.docs) {
      const invoiceId = invoiceDoc.id;
      const invoice = invoiceDoc.data();
      
      // Check payment activity for this invoice
      const paymentActivities = await db
        .collection('Invoices')
        .doc(invoiceId)
        .collection('PaymentActivities')
        .orderBy('createdAt', 'desc')
        .get();
      
      if (paymentActivities.empty) {
        // No payment attempts yet
        invoicesNeedingPayment.push({
          invoiceId,
          invoice,
          needsFirstAttempt: true
        });
      } else {
        // Check if we can retry
        const latestActivity = paymentActivities.docs[0].data();
        const canRetry = await canRetryPayment(invoiceId, latestActivity);
        
        if (canRetry) {
          invoicesNeedingPayment.push({
            invoiceId,
            invoice,
            needsRetry: true,
            latestActivity
          });
        }
      }
    }
    
    logger.info('🔍 [RETRY] Found invoices needing payment:', {
      count: invoicesNeedingPayment.length,
      firstAttempts: invoicesNeedingPayment.filter(i => i.needsFirstAttempt).length,
      retries: invoicesNeedingPayment.filter(i => i.needsRetry).length
    });
    
    return invoicesNeedingPayment;
  } catch (error) {
    logger.error('❌ [RETRY] Failed to find invoices needing payment:', {
      error: error.message
    });
    throw error;
  }
};

/**
 * Check if a payment can be retried
 * @param {string} invoiceId - Invoice ID
 * @param {Object} latestActivity - Latest payment activity
 * @returns {Promise<boolean>} - Whether payment can be retried
 */
const canRetryPayment = async (invoiceId, latestActivity) => {
  // Check if latest activity was successful
  if (latestActivity.status === PAYMENT_ACTIVITY_STATUS.SUCCESS) {
    return false;
  }
  
  // Check retry count
  if (latestActivity.retryCount >= PAYMENT_CONFIG.MAX_RETRY_ATTEMPTS) {
    logger.info('🚫 [RETRY] Max retry attempts reached:', {
      invoiceId,
      retryCount: latestActivity.retryCount,
      maxRetries: PAYMENT_CONFIG.MAX_RETRY_ATTEMPTS
    });
    return false;
  }
  
  // Check if enough time has passed since last attempt
  const lastAttemptTime = latestActivity.createdAt.toDate();
  const now = new Date();
  const hoursSinceLastAttempt = (now - lastAttemptTime) / (1000 * 60 * 60);
  
  if (hoursSinceLastAttempt < PAYMENT_CONFIG.RETRY_INTERVAL_HOURS) {
    logger.info('⏰ [RETRY] Not enough time passed since last attempt:', {
      invoiceId,
      hoursSinceLastAttempt,
      requiredHours: PAYMENT_CONFIG.RETRY_INTERVAL_HOURS
    });
    return false;
  }
  
  return true;
};

/**
 * Create a retry payment activity
 * @param {string} invoiceId - Invoice ID
 * @param {Object} previousActivity - Previous payment activity
 * @returns {Promise<Object>} - Created payment activity
 */
const createRetryPaymentActivity = async (invoiceId, previousActivity) => {
  try {
    const retryCount = (previousActivity.retryCount || 0) + 1;
    
    const paymentActivity = {
      invoiceId,
      activityType: PAYMENT_ACTIVITY_TYPES.RETRY,
      stripePaymentIntentId: null, // Will be set when Payment Intent is created
      stripeEventId: null,
      status: PAYMENT_ACTIVITY_STATUS.PENDING,
      amountCents: previousActivity.amountCents,
      paymentMethod: previousActivity.paymentMethod,
      retryCount,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      metadata: {
        previousActivityId: previousActivity.id,
        retryReason: 'scheduled_retry'
      },
      previousActivityId: previousActivity.id
    };
    
    const activityRef = await db
      .collection('Invoices')
      .doc(invoiceId)
      .collection('PaymentActivities')
      .add(paymentActivity);
    
    logger.info('🔄 [RETRY] Created retry payment activity:', {
      invoiceId,
      activityId: activityRef.id,
      retryCount
    });
    
    return { id: activityRef.id, ...paymentActivity };
  } catch (error) {
    logger.error('❌ [RETRY] Failed to create retry payment activity:', {
      invoiceId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Create a new payment activity for first attempt
 * @param {string} invoiceId - Invoice ID
 * @param {Object} invoice - Invoice data
 * @returns {Promise<Object>} - Created payment activity
 */
const createFirstPaymentActivity = async (invoiceId, invoice) => {
  try {
    const paymentActivity = {
      invoiceId,
      activityType: PAYMENT_ACTIVITY_TYPES.PAYMENT_ATTEMPT,
      stripePaymentIntentId: null, // Will be set when Payment Intent is created
      stripeEventId: null,
      status: PAYMENT_ACTIVITY_STATUS.PENDING,
      amountCents: invoice.totalCents,
      paymentMethod: 'card', // Default payment method
      retryCount: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      metadata: {
        firstAttempt: true
      }
    };
    
    const activityRef = await db
      .collection('Invoices')
      .doc(invoiceId)
      .collection('PaymentActivities')
      .add(paymentActivity);
    
    logger.info('🆕 [RETRY] Created first payment activity:', {
      invoiceId,
      activityId: activityRef.id
    });
    
    return { id: activityRef.id, ...paymentActivity };
  } catch (error) {
    logger.error('❌ [RETRY] Failed to create first payment activity:', {
      invoiceId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Process scheduled payment retries
 * @returns {Promise<Object>} - Processing result
 */
const processScheduledPayments = async () => {
  try {
    logger.info('🚀 [RETRY] Starting scheduled payment processing');
    
    const invoicesNeedingPayment = await findInvoicesNeedingPayment();
    
    const results = {
      processed: 0,
      firstAttempts: 0,
      retries: 0,
      errors: 0
    };
    
    for (const invoiceData of invoicesNeedingPayment) {
      try {
        let paymentActivity;
        
        if (invoiceData.needsFirstAttempt) {
          paymentActivity = await createFirstPaymentActivity(
            invoiceData.invoiceId,
            invoiceData.invoice
          );
          results.firstAttempts++;
        } else if (invoiceData.needsRetry) {
          paymentActivity = await createRetryPaymentActivity(
            invoiceData.invoiceId,
            invoiceData.latestActivity
          );
          results.retries++;
        }
        
        // Create Stripe Payment Intent
        const { createPaymentIntent } = require('./stripeHelpers');
        const paymentIntent = await createPaymentIntent(invoiceData.invoiceId, {
          customerId: null // Will create new customer if needed
        });
        
        // Update payment activity with Payment Intent ID
        await db
          .collection('Invoices')
          .doc(invoiceData.invoiceId)
          .collection('PaymentActivities')
          .doc(paymentActivity.id)
          .update({
            stripePaymentIntentId: paymentIntent.id,
            updatedAt: Timestamp.now()
          });
        
        results.processed++;
      } catch (error) {
        logger.error('❌ [RETRY] Failed to process invoice:', {
          invoiceId: invoiceData.invoiceId,
          error: error.message
        });
        results.errors++;
      }
    }
    
    logger.info('✅ [RETRY] Scheduled payment processing completed:', results);
    
    return results;
  } catch (error) {
    logger.error('❌ [RETRY] Scheduled payment processing failed:', {
      error: error.message
    });
    throw error;
  }
};

module.exports = {
  findInvoicesNeedingPayment,
  canRetryPayment,
  createRetryPaymentActivity,
  createFirstPaymentActivity,
  processScheduledPayments
};
