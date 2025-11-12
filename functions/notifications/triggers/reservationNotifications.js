const functions = require('firebase-functions/v1');
const { createNotification } = require('../helpers/notificationHelpers');
const { RESERVATION_STATUS } = require('../../constants');

// 1. New confirmed reservation
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

// 2. Reservation cancellations
exports.createReservationCancellationNotification = functions.firestore
  .document('Reservations/{reservationId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.status !== RESERVATION_STATUS.CANCELLED &&
      after.status === RESERVATION_STATUS.CANCELLED) {
      await createNotification({
        message: `Refund requested for ${after.start > DateTime.now().toJSDate() ? "future" : "past"} reservation by user: ${after.userId}`,
        type: 'admin',
        isAdminMessage: true
      });
    }
  });
