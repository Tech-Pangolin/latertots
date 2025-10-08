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

// Billing functions removed - using checkout session flow

// Payment functions
const { stripeWebhook } = require('./payments/webhooks/stripeWebhook');
const { createCheckoutSession } = require('./payments/checkout/createCheckoutSession');
const { cleanupFailedPayments } = require('./payments/cleanup/cleanupFailedPayments');
const { dailyProductSync, syncProductsManual } = require('./payments/helpers/productHelpers');

// Email functions
const { sendContactEmail } = require('./email/contactEmail');
const { sendPickupPaymentNotification } = require('./email/sendPickupPaymentNotification');
const { checkPickupPaymentReminders } = require('./email/checkPickupPaymentReminders');

// Form draft functions
const { upsertFormDraft } = require('./formDrafts/upsertFormDraft');

// Cleanup functions
const { cleanupFailedReservations, cleanupFailedReservationsManual } = require('./cleanup/cleanupFailedReservations');

// Payment history functions
const { getPaymentHistory } = require('./payments/getPaymentHistory');




// Export all functions
exports.createUserProfile = createUserProfile;
exports.updateAdminClaims = updateAdminClaims;
exports.createReservationRequestNotification = createReservationRequestNotification;
exports.createReservationCancellationNotification = createReservationCancellationNotification;
exports.createUserAccountProblemNotification = createUserAccountProblemNotification;
exports.cleanupExpiredNotifications = cleanupExpiredNotifications;
// dailyBillingJob removed - using checkout session flow
exports.stripeWebhook = stripeWebhook;
exports.createCheckoutSession = createCheckoutSession;
exports.cleanupFailedPayments = cleanupFailedPayments;
exports.dailyProductSync = dailyProductSync;
exports.syncProductsManual = syncProductsManual;
exports.sendContactEmail = sendContactEmail;
exports.sendPickupPaymentNotification = sendPickupPaymentNotification;
exports.checkPickupPaymentReminders = checkPickupPaymentReminders;
exports.upsertFormDraft = upsertFormDraft;
exports.cleanupFailedReservations = cleanupFailedReservations;
exports.cleanupFailedReservationsManual = cleanupFailedReservationsManual;
exports.getPaymentHistory = getPaymentHistory;



// Deployment command: firebase deploy --only functions
// Run from the root of the project directory

// Don't use functions config or env variables. Use parameterized secrets.
// Set secrets command: firebase functions:secrets:set THE_NAME_OF_THE_SECRET
    // Once you run the set command, it'll prompt you for the value of the secret.

// Get secrets command: firebase functions:secrets:access THE_NAME_OF_THE_SECRET

// See all the secret names: gcloud secrets list