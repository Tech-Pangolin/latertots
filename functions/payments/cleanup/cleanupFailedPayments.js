// cleanupFailedPayments.js - Firebase Function to cleanup failed payment attempts
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const logger = require('firebase-functions/logger');
const { RESERVATION_STATUS } = require('../../constants');

const db = getFirestore();

/**
 * Cleanup failed payment attempts - runs every hour
 * Cancels reservations that have been PENDING for over 1 hour
 */
exports.cleanupFailedPayments = onSchedule(
  {
    schedule: '0 * * * *', // Every hour at minute 0
    timeZone: 'America/New_York'
  },
  async (event) => {
    try {
      logger.info('🧹 [CLEANUP] Starting failed payment cleanup...');
      
      // Calculate cutoff time (1 hour ago)
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      const cutoffTimestamp = Timestamp.fromDate(oneHourAgo);
      
      // Find reservations that are PENDING and older than 1 hour
      const pendingReservations = await db
        .collection('Reservations')
        .where('status', '==', RESERVATION_STATUS.PENDING)
        .where('createdAt', '<', cutoffTimestamp)
        .get();
      
      if (pendingReservations.empty) {
        logger.info('✅ [CLEANUP] No failed payments to cleanup');
        return;
      }
      
      logger.info(`🔍 [CLEANUP] Found ${pendingReservations.size} failed payment attempts to cleanup`);
      
      // Update reservations to CANCELLED status
      const batch = db.batch();
      const cancelledReservationIds = [];
      
      pendingReservations.forEach(doc => {
        const reservationRef = doc.ref;
        batch.update(reservationRef, {
          status: RESERVATION_STATUS.CANCELLED,
          cancelledAt: Timestamp.now(),
          cancellationReason: 'Payment timeout - no payment received within 1 hour'
        });
        cancelledReservationIds.push(doc.id);
      });
      
      await batch.commit();
      
      logger.info('✅ [CLEANUP] Successfully cancelled failed payment attempts:', {
        cancelledCount: pendingReservations.size,
        cancelledReservationIds: cancelledReservationIds
      });
      
    } catch (error) {
      logger.error('❌ [CLEANUP] Failed to cleanup failed payments:', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
);
