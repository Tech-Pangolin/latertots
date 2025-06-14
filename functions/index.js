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


// Deployment command: firebase deploy --only functions
// Run from the root of the project directory