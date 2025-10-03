// cleanupFailedReservations.js - Hourly cleanup for expired form drafts and orphaned reservations
const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onCall } = require('firebase-functions/v2/https');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const logger = require('firebase-functions/logger');

const db = getFirestore();

/**
 * Core cleanup logic - removes expired form drafts and their associated reservations
 * If options.specificDraftId is provided, only that draft's orphaned reservations are removed
 */
async function performCleanup(options = {}) {
  const { specificDraftId = null, userId = null } = options;
  logger.debug('🧹 [performCleanup]: Starting cleanup of failed reservations and expired form drafts', { specificDraftId, userId });
  
  try {
    const now = new Date();
    
    let draftsToProcess = [];
    if (specificDraftId) {
      const draftSnap = await db.collection('FormDrafts').doc(specificDraftId).get();
      if (draftSnap.exists) {
        draftsToProcess = [draftSnap];
      } else {
        logger.info(`🧹 [performCleanup]: No draft found for id ${specificDraftId}`);
      }
    } else {
      // Clean up expired form drafts
      const expiredDrafts = await db.collection('FormDrafts')
        .where('expiresAt', '<', now)
        .get();
      draftsToProcess = expiredDrafts.docs;
    }
    
    logger.debug(`🧹 [performCleanup]: Found ${draftsToProcess.length} ${specificDraftId ? 'specific' : 'expired'} form drafts`);
    
    let failedOrOrphanedReservationsCount = 0;
    let removedDraftsCount = 0;
    for (const draft of draftsToProcess) {
      try {
        // Delete associated reservations
        const reservations = await db.collection('Reservations')
          .where('formDraftId', '==', draft.id)
          .get();
        
        failedOrOrphanedReservationsCount += reservations.docs.length;
        for (const reservation of reservations.docs) {
          await reservation.ref.delete();
        }
        
        // Delete draft (only when performing expired cleanup OR if specifically targeted)
        await draft.ref.delete();
        removedDraftsCount += 1;
      } catch (error) {
        logger.error(`🧹 [performCleanup]: Error deleting draft FormDraft/${draft.id}`, error);
      }
    }
    
    const result = {
      success: true,
      message: `🧹 [performCleanup]: Cleanup completed: removed ${removedDraftsCount} form drafts and ${failedOrOrphanedReservationsCount} reservations`,
      removedDrafts: removedDraftsCount,
      removedReservations: failedOrOrphanedReservationsCount
    };
    
    logger.info('🧹 [performCleanup]: Cleanup completed successfully', {
      removedDrafts: removedDraftsCount,
      failedOrOrphanedReservationsCount
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
  schedule: '* * * * *', // Every minute (for testing in emulator) TODO: Change to hourly
  timeZone: 'America/New_York',
  memory: '256MiB',
  timeoutSeconds: 540,
}, async (event) => {
  try {
    const result = await performCleanup();
    return result;
  } catch (error) {
    logger.error('🧹 [cleanupFailedReservations]: Error in scheduled cleanup:', error);
  }
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
  }
});

// Export the core cleanup function for use by other modules
exports.performCleanup = performCleanup;