const admin = require('../../firebaseInit');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const logger = require("firebase-functions/logger");
const NotificationSchema = require('../../schemas/NotificationSchema');

const db = getFirestore();

// Helper function to create notifications
const createNotification = async (notificationData) => {
  try {
    const notification = {
      ...notificationData,
      createdAt: Timestamp.now(),
      expiresAt: notificationData.expiresAt || Timestamp.fromDate(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      )
    };

    // Validate notification data before saving
    const { error, value } = NotificationSchema.validate(notification);
    if (error) {
      logger.error('Notification validation failed:', error.details);
      return;
    }

    await db.collection('Notifications').add(value);
  } catch (error) {
    logger.error('Error creating notification:', error);
  }
};

module.exports = {
  createNotification
};
