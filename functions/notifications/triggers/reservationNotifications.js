const functions = require('firebase-functions/v1');
const { createNotification } = require('../helpers/notificationHelpers');
const { RESERVATION_STATUS } = require('../../constants');

// Consolidated reservation notification handler
exports.createReservationNotifications = functions.firestore
  .document('Reservations/{reservationId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();  
    const after = change.after.data();
    const beforeStatus = before.status;
    const afterStatus = after.status;

    // Only proceed if status actually changed
    if (beforeStatus === afterStatus) {
      return;
    }

    // Case 1: PENDING → CONFIRMED (new confirmed reservation)
    if (beforeStatus === RESERVATION_STATUS.PENDING && 
        afterStatus === RESERVATION_STATUS.CONFIRMED) {
      await createNotification({
        message: `New confirmed reservation for ${after.title} on ${after.start.toDate().toLocaleDateString()}`,
        type: 'admin',
        isAdminMessage: true
      });
    }

    // Case 2: Any status → CANCELLED (cancellation/refund for future reservation)
    if (beforeStatus !== RESERVATION_STATUS.CANCELLED && 
        afterStatus === RESERVATION_STATUS.CANCELLED) {
      await createNotification({
        message: `Refund requested for future reservation for ${after.title} on ${after.start.toDate().toLocaleDateString()}`,
        type: 'admin',
        isAdminMessage: true
      });
    }

    // Case 3: Any status → REFUND_REQUESTED (refund request for past reservation)
    if (beforeStatus !== RESERVATION_STATUS.REFUND_REQUESTED && 
        afterStatus === RESERVATION_STATUS.REFUND_REQUESTED) {
      await createNotification({
        message: `Refund requested for past reservation for ${after.title} on ${after.start.toDate().toLocaleDateString()}`,
        type: 'admin',
        isAdminMessage: true
      });
    }
  });