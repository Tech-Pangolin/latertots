// cleanupFailedReservations.js - Hourly cleanup for expired form drafts and orphaned reservations
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onCall } = require('firebase-functions/v2/https');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const logger = require('firebase-functions/logger');

const db = getFirestore();

/**
 * Core cleanup logic - removes expired form drafts and their associated reservations
 */
async function performCleanup() {
  logger.info('🧹 [performCleanup]: Starting cleanup of failed reservations and expired form drafts');
  
  try {
    const now = new Date();
    
    // Clean up expired form drafts
    const expiredDrafts = await db.collection('FormDrafts')
      .where('expiresAt', '<', now)
      .get();
    
    logger.info(`🧹 [performCleanup]: Found ${expiredDrafts.size} expired form drafts`);
    
    let orphanedReservationsCount = 0;
    for (const draft of expiredDrafts.docs) {
      try {
        // Delete associated reservations
        const reservations = await db.collection('Reservations')
          .where('formDraftId', '==', draft.id)
          .get();
        
        orphanedReservationsCount += reservations.docs.length;
        for (const reservation of reservations.docs) {
          await reservation.ref.delete();
        }
        
        // Delete draft
        await draft.ref.delete();
      } catch (error) {
        logger.error(`🧹 [performCleanup]: Error deleting draft FormDraft/${draft.id}`, error);
      }
    }
    
    const result = {
      success: true,
      message: `🧹 [performCleanup]: Cleanup completed: removed ${expiredDrafts.size} form drafts and ${orphanedReservationsCount} reservations`,
      removedDrafts: expiredDrafts.size,
      removedReservations: orphanedReservations
    };
    
    logger.info('🧹 [performCleanup]: Cleanup completed successfully', {
      expiredDrafts: expiredDrafts.size,
      orphanedReservationsCount
    });
    
    return result;
  } catch (error) {
    logger.error('🧹 [performCleanup]: Error during cleanup:', error);
    throw error;
  }
}

/**
 * Scheduled cleanup job - runs automatically
 */
exports.cleanupFailedReservations = onSchedule({
  schedule: '* * * * *', // Every minute (for testing in emulator)
  timeZone: 'America/New_York',
  memory: '256MiB',
  timeoutSeconds: 540,
}, async (event) => {
  try {
    const result = await performCleanup();
    return result;
  } catch (error) {
    logger.error('🧹 [cleanupFailedReservations]: Error in scheduled cleanup:', error);
    throw new Error(`🧹 [cleanupFailedReservations]: Cleanup failed: ${error.message}`);
  }
  return await performCleanup();
});

/**
 * Callable cleanup function - can be triggered manually
 */
exports.cleanupFailedReservationsManual = onCall(async (request) => {
  try {
    const result = await performCleanup();
    return result;
  } catch (error) {
    logger.error('🧹 [cleanupFailedReservationsManual]: Error in manual cleanup:', error);
    throw new Error(`🧹 [cleanupFailedReservationsManual]: Cleanup failed: ${error.message}`);
  }
});