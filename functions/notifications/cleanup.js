const functions = require('firebase-functions/v1');
const logger = require("firebase-functions/logger");
const admin = require('../firebaseInit');
const { getFirestore } = require('firebase-admin/firestore');

const db = getFirestore();

// Auto-expiration of old notifications
exports.cleanupExpiredNotifications = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    const notificationsRef = db.collection('Notifications');
    const now = admin.firestore.Timestamp.now();

    const expiredNotifications = await notificationsRef
      .where('expiresAt', '<', now)
      .get();

    const batch = db.batch();
    expiredNotifications.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    if (expiredNotifications.size > 0) {
      await batch.commit();
      logger.info(`Cleaned up ${expiredNotifications.size} expired notifications`);
    }
  });
