const { onCall } = require('firebase-functions/v2/https');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const logger = require('firebase-functions/logger');

const db = getFirestore();

/**
 * Send pickup payment notification email
 * Called only if reservation has been at pickup status for 30+ minutes
 * @param {Object} data - Contains userId, reservationId, checkoutUrl, amount
 * @returns {Promise<Object>} - Success status
 */
exports.sendPickupPaymentNotification = onCall(async (data, context) => {
  const { userId, reservationId, checkoutUrl, amount } = data.data;
  
  try {
    // TODO: Implement email notification logic
    // - Fetch user email from Users collection
    // - Send email with checkout link using email service
    // - Include service details and amount
    // - Track notification sent timestamp
    
    logger.info('📧 [sendPickupPaymentNotification] Notification would be sent:', {
      userId,
      reservationId,
      checkoutUrl,
      amount,
      timestamp: new Date().toISOString()
    });
    
    // Placeholder: Log that notification was triggered
    await db.collection('NotificationLog').add({
      type: 'pickup_payment_reminder',
      userId,
      reservationId,
      amount,
      checkoutUrl,
      sentAt: Timestamp.now(),
      status: 'placeholder_logged'
    });
    
    return { 
      success: true, 
      message: 'Notification placeholder executed',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('❌ [sendPickupPaymentNotification] Failed:', {
      error: error.message,
      userId,
      reservationId
    });
    throw error;
  }
});
