/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const functions = require('firebase-functions');
const logger = require("firebase-functions/logger");
const admin = require('firebase-admin');
const NotificationSchema = require('./schemas/NotificationSchema');
admin.initializeApp();

exports.createUserProfile = functions.auth.user().onCreate(async (user) => {
  return admin.firestore().collection('Users').doc(user.uid).set({
    Email: user.email,
    Role: admin.firestore().doc('Roles/parent-user'),
    archived: false,
  })
});

exports.updateAdminClaims = functions.firestore
  .document('Users/{userId}')
  .onUpdate(async (change, context) => {
    const userId = context.params.userId;

    // Get the previous and new data
    const beforeData = change.before.data();
    const afterData = change.after.data();

    // Get the new Role reference
    const newRoleRef = afterData.Role;

    // Check if the Role reference has changed
    if (beforeData.Role !== newRoleRef) {
      try {
        let newRoleName = null;

        // If the new Role reference exists, fetch the role document
        if (newRoleRef) {
          const roleDoc = await newRoleRef.get();
          if (roleDoc.exists) {
            newRoleName = roleDoc.data().name;
          } else {
            logger.warn(`Role document ${newRoleRef.path} does not exist.`);
          }
        }

        if (newRoleName === 'admin') {
          // Add the 'admin' custom claim
          await admin.auth().setCustomUserClaims(userId, { role: 'admin' });
          logger.info(`Custom claims updated: ${userId} is now an admin.`);
        } else {
          // Remove the 'admin' custom claim (or reset role)
          await admin.auth().setCustomUserClaims(userId, { role: null });
          logger.info(`Custom claims updated: ${userId} is no longer an admin.`);
        }
      } catch (error) {
        logger.error(`Error updating custom claims for ${userId}:`, error);
      }
    }
  });

  exports.calculateCharges = functions.pubsub
  .schedule('every 15 minutes')
  .onRun(async () => {
    logger.info('calculateCharges: function triggered');
    const reservationsRef = admin.firestore().collection('reservations');

    // Query reservations that are locked and unpaid
    const reservationsSnapshot = await reservationsRef
      .where('locked', '==', true)
      .where('status', '==', 'unpaid')
      .get();

    const batch = admin.firestore().batch();

    reservationsSnapshot.forEach((doc) => {
      const reservation = doc.data();

      // Calculate charges based on service duration
      const total = reservation.services.reduce((sum, service) => {
        const duration = Math.ceil(
          (service.endTime.toDate() - service.startTime.toDate()) / 900000
        ); // Round up to nearest 15 min
        return sum + duration * service.rate;
      }, 0);

      // Update the reservation with calculated charges
      batch.update(doc.ref, {
        charges: {
          total,
          breakdown: reservation.services.map((service) => ({
            serviceType: service.serviceType,
            amount: Math.ceil(
              (service.endTime.toDate() - service.startTime.toDate()) / 900000
            ) * service.rate,
          })),
        },
        status: 'unpaid', // Retain the unpaid status
      });
    });

    // Commit batched updates
    await batch.commit();
    logger.info('calculateCharges: complete for all eligible reservations.');
  });

  exports.lockReservation = functions.firestore
  .document('reservations/{reservationId}')
  .onUpdate(async (change, context) => {
    logger.info(`lockReservation: checking reservation ${context.params.reservationId} for lock`);
    const after = change.after.data();

    // If actualPickupTime is set, lock the reservation and set status to "unpaid"
    if (after.actualPickupTime && !after.locked) {
      await change.after.ref.update({
        locked: true,
        status: 'unpaid',
      });

      await admin.firestore().collection('auditLogs').add({
        type: 'reservationLock',
        details: {
          reservationId: context.params.reservationId,
          status: 'unpaid',
        },
        timestamp: admin.firestore.Timestamp.now(),
      });

      logger.info(`Reservation ${context.params.reservationId} locked and marked as unpaid.`);
    }
  });


// Helper function to create notifications
const createNotification = async (notificationData) => {
  try {
    const notification = {
      ...notificationData,
      createdAt: admin.firestore.Timestamp.now(),
      expiresAt: notificationData.expiresAt || admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      )
    };
    
    // Validate notification data before saving
    const { error, value } = NotificationSchema.validate(notification);
    if (error) {
      logger.error('Notification validation failed:', error.details);
      return;
    }
    
    await admin.firestore().collection('Notifications').add(value);
  } catch (error) {
    logger.error('Error creating notification:', error);
  }
};

// Notification triggers for admin users

// 1. New reservation requests
exports.createReservationRequestNotification = functions.firestore
  .document('Reservations/{reservationId}')
  .onCreate(async (snapshot, context) => {
    const reservation = snapshot.data();
    
    if (reservation.extendedProps?.status === 'pending') {
      await createNotification({
        message: `New reservation pending approval for ${reservation.title}`,
        type: 'admin',
        isAdminMessage: true
      });
    }
  });

// 2. Reservation cancellations
exports.createReservationCancellationNotification = functions.firestore
  .document('Reservations/{reservationId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    if (before.extendedProps?.status !== 'cancelled' && 
        after.extendedProps?.status === 'cancelled') {
      await createNotification({
        message: `Reservation cancelled by user: ${after.title}`,
        type: 'admin',
        isAdminMessage: true
      });
    }
  });

// 3. Payment failures
// exports.createPaymentFailureNotification = functions.firestore
//   .document('Reservations/{reservationId}')
//   .onUpdate(async (change, context) => {
//     const before = change.before.data();
//     const after = change.after.data();
    
//     if (before.extendedProps?.status !== 'unpaid' && 
//         after.extendedProps?.status === 'unpaid') {
//       await createNotification({
//         message: `Payment failed for reservation ${context.params.reservationId} - user ${after.userId}`,
//         type: 'admin',
//         isAdminMessage: true
//       });
//     }
//   });

// 4. User account issues (payment holds)
exports.createUserAccountIssueNotification = functions.firestore
  .document('Users/{userId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    if (!before.paymentHold && after.paymentHold) {
      await createNotification({
        message: `User account locked due to payment hold: ${after.Email}`,
        type: 'admin',
        isAdminMessage: true
      });
    }
  });



// 5. Overdue payments (scheduled function) 
// This should probably be an aggregate notification


// exports.createOverduePaymentNotification = functions.pubsub
//   .schedule('every 24 hours')
//   .onRun(async () => {
//     const reservationsRef = admin.firestore().collection('Reservations');
//     const now = admin.firestore.Timestamp.now();
//     const sevenDaysAgo = admin.firestore.Timestamp.fromDate(
//       new Date(now.toDate().getTime() - 7 * 24 * 60 * 60 * 1000)
//     );
    
//     const overdueReservations = await reservationsRef
//       .where('extendedProps.status', '==', 'unpaid')
//       .where('end', '<', sevenDaysAgo)
//       .get();
    
//     for (const doc of overdueReservations.docs) {
//       const reservation = doc.data();
//       const daysOverdue = Math.floor(
//         (now.toDate().getTime() - reservation.end.toDate().getTime()) / (24 * 60 * 60 * 1000)
//       );
      
//       await createNotification({
//         message: `Payment overdue for ${daysOverdue} days - user ${reservation.userId}`,
//         type: 'admin',
//         isAdminMessage: true
//       });
//     }
//   });

// 6. Refund requests (when status changes to refunded)
// exports.createRefundRequestNotification = functions.firestore
//   .document('Reservations/{reservationId}')
//   .onUpdate(async (change, context) => {
//     const before = change.before.data();
//     const after = change.after.data();
    
//     if (before.extendedProps?.status !== 'refunded' && 
//         after.extendedProps?.status === 'refunded') {
//       await createNotification({
//         message: `Refund requested for reservation ${context.params.reservationId}`,
//         type: 'admin',
//         isAdminMessage: true
//       });
//     }
//   });

// 7. Capacity warnings (scheduled function)
// exports.createCapacityWarningNotification = functions.pubsub
//   .schedule('every 6 hours')
//   .onRun(async () => {
//     const reservationsRef = admin.firestore().collection('Reservations');
//     const now = new Date();
//     const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
//     const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    
//     // Check capacity for next 2 days
//     for (let checkDate = tomorrow; checkDate <= dayAfter; checkDate.setDate(checkDate.getDate() + 1)) {
//       const startOfDay = admin.firestore.Timestamp.fromDate(new Date(checkDate.setHours(0, 0, 0, 0)));
//       const endOfDay = admin.firestore.Timestamp.fromDate(new Date(checkDate.setHours(23, 59, 59, 999)));
      
//       const dayReservations = await reservationsRef
//         .where('start', '>=', startOfDay)
//         .where('start', '<=', endOfDay)
//         .where('extendedProps.status', 'in', ['pending', 'confirmed'])
//         .get();
      
//       // Assuming max capacity of 5 reservations per day (based on existing overlap limit)
//       const capacityPercentage = (dayReservations.size / 5) * 100;
      
//       if (capacityPercentage >= 80) {
//         await createNotification({
//           message: `Reservation capacity at ${Math.round(capacityPercentage)}% for ${checkDate.toDateString()}`,
//           type: 'admin',
//           isAdminMessage: true
//         });
//       }
//     }
//   });

// Auto-expiration of old notifications
exports.cleanupExpiredNotifications = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    const notificationsRef = admin.firestore().collection('Notifications');
    const now = admin.firestore.Timestamp.now();
    
    const expiredNotifications = await notificationsRef
      .where('expiresAt', '<', now)
      .get();
    
    const batch = admin.firestore().batch();
    expiredNotifications.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    if (expiredNotifications.size > 0) {
      await batch.commit();
      logger.info(`Cleaned up ${expiredNotifications.size} expired notifications`);
    }
  });

// Deployment command: firebase deploy --only functions
// Run from the root of the project directory