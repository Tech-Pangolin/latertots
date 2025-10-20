const functions = require('firebase-functions/v1');
const { createNotification } = require('../helpers/notificationHelpers');

// 1. New reservation requests
exports.createReservationRequestNotification = functions.firestore
  .document('Reservations/{reservationId}')
  .onCreate(async (snapshot, context) => {
    const reservation = snapshot.data();

    if (reservation.status === 'pending') {
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

    if (before.status !== 'cancelled' &&
      after.status === 'cancelled') {
      await createNotification({
        message: `Reservation cancelled by user: ${after.title}`,
        type: 'admin',
        isAdminMessage: true
      });
    }
  });
