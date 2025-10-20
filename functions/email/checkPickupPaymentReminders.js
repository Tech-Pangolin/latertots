const { onSchedule } = require('firebase-functions/v2/scheduler');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const logger = require('firebase-functions/logger');
const { getFunctions } = require('firebase-admin/functions');

const db = getFirestore();

/**
 * Check for reservations at picked-up status for 30+ minutes
 * Runs every 15 minutes
 */
exports.checkPickupPaymentReminders = onSchedule(
  {
    schedule: '*/15 * * * *', // Every 15 minutes
    timeZone: 'America/New_York'
  },
  async (event) => {
    try {
      logger.info('🔍 [checkPickupPaymentReminders] Starting check...');
      
      const thirtyMinutesAgo = Timestamp.fromMillis(Date.now() - 30 * 60 * 1000);
      
      const pickedUpReservations = await db
        .collection('Reservations')
        .where('status', '==', 'picked-up')
        .where('dropOffPickUp.pickedUpAt', '<=', thirtyMinutesAgo)
        .get();
      
      logger.info(`Found ${pickedUpReservations.size} reservations requiring payment reminders`);
      
      for (const doc of pickedUpReservations.docs) {
        const data = doc.data();
        
        // Skip if already notified or no checkout URL
        if (data.dropOffPickUp?.paymentReminderSent || !data.dropOffPickUp?.finalCheckoutUrl) {
          continue;
        }
        
        // Call notification function
        const functions = getFunctions();
        await functions.taskQueue('sendPickupPaymentNotification').enqueue({
          userId: data.userId,
          reservationId: doc.id,
          checkoutUrl: data.dropOffPickUp.finalCheckoutUrl,
          amount: data.dropOffPickUp.finalAmount
        });
        
        // Mark as notified
        await doc.ref.update({
          'dropOffPickUp.paymentReminderSent': true,
          'dropOffPickUp.paymentReminderSentAt': Timestamp.now()
        });
        
        logger.info(`📧 Queued notification for reservation ${doc.id}`);
      }
      
      logger.info('✅ [checkPickupPaymentReminders] Check completed');
    } catch (error) {
      logger.error('❌ [checkPickupPaymentReminders] Error:', error);
    }
  }
);
