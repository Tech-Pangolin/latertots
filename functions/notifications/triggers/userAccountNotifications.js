const functions = require('firebase-functions/v1');
const { createNotification } = require('../helpers/notificationHelpers');

// 4. User account issues (payment holds)
exports.createUserAccountProblemNotification = functions.firestore
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
