const functions = require('firebase-functions/v1');
const { createNotification } = require('../helpers/notificationHelpers');
const { RESERVATION_STATUS } = require('../../constants');

// New confirmed reservation
exports.createNewReservationNotification = functions.firestore
  .document('Reservations/{reservationId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();  
    const after = change.after.data();

    if (before.status !== RESERVATION_STATUS.PENDING && after.status === RESERVATION_STATUS.CONFIRMED) {
      await createNotification({
        message: `New confirmed reservation for ${after.title} on ${after.start.toDate().toLocaleDateString()}`,
        type: 'admin',
        isAdminMessage: true
      });
    }
  });

// Reservation cancellation and refund request
exports.createReservationCancellationNotification = functions.firestore
  .document('Reservations/{reservationId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.status !== RESERVATION_STATUS.CANCELLED &&
      after.status === RESERVATION_STATUS.CANCELLED) {
      await createNotification({
        message: `Refund requested for future reservation for ${after.title} on ${after.start.toDate().toLocaleDateString()}`,
        type: 'admin',
        isAdminMessage: true
      });
    }
  });

// Reservation simple refund request
exports.createReservationSimpleRefundRequestNotification = functions.firestore
  .document('Reservations/{reservationId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.status !== RESERVATION_STATUS.REFUND_REQUESTED &&
      after.status === RESERVATION_STATUS.REFUND_REQUESTED) {
      await createNotification({
        message: `Refund requested for past reservation for ${after.title} on ${after.start.toDate().toLocaleDateString()}`,
        type: 'user',
        isAdminMessage: false
      });
    }
  });
