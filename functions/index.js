/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// Authentication functions
const { createUserProfile } = require('./auth/userCreation');
const { updateAdminClaims } = require('./auth/adminClaims');

// Notification functions
const { createReservationRequestNotification } = require('./notifications/triggers/reservationNotifications');
const { createReservationCancellationNotification } = require('./notifications/triggers/reservationNotifications');
const { createUserAccountProblemNotification } = require('./notifications/triggers/userAccountNotifications');
const { cleanupExpiredNotifications } = require('./notifications/cleanup');

// Billing functions
const { dailyBillingJob } = require('./billing/dailyBillingJob');

// Payment functions
const { stripeWebhook } = require('./payments/webhooks/stripeWebhook');
const { processScheduledPayments } = require('./payments/scheduled/paymentProcessing');
const { processRefund } = require('./payments/refunds/refundProcessing');

// Email functions
const { sendContactEmail } = require('./email/contactEmail');

// Export all functions
exports.createUserProfile = createUserProfile;
exports.updateAdminClaims = updateAdminClaims;

exports.createReservationRequestNotification = createReservationRequestNotification;
exports.createReservationCancellationNotification = createReservationCancellationNotification;

exports.createUserAccountProblemNotification = createUserAccountProblemNotification;


exports.cleanupExpiredNotifications = cleanupExpiredNotifications;

exports.dailyBillingJob = dailyBillingJob;

exports.stripeWebhook = stripeWebhook;

exports.processScheduledPayments = processScheduledPayments;

exports.processRefund = processRefund;

exports.sendContactEmail = sendContactEmail;



// Deployment command: firebase deploy --only functions
// Run from the root of the project directory