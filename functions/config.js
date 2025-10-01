// config.js - Parameterized configuration for Cloud Functions
// 
// This file defines configuration parameters using firebase-functions/params
// for secure, type-safe configuration management.

const { defineSecret, defineString, defineBoolean, defineInt } = require('firebase-functions/params');

// Stripe secrets - stored in Google Cloud Secret Manager
const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');
const latertotsEmail = defineSecret('LATERTOTS_EMAIL_ADDRESS');
const emailPasscode = defineSecret('EMAIL_PASSCODE');

// App configuration
const appUrl = defineSecret('APP_URL');

module.exports = {
  // Secrets (from Secret Manager)
  stripeSecretKey,
  stripeWebhookSecret,
  latertotsEmail,
  emailPasscode,
  appUrl,
};

// Don't use functions config or env variables. Use parameterized secrets.
// Set secrets command: firebase functions:secrets:set THE_NAME_OF_THE_SECRET
    // Once you run the set command, it'll prompt you for the value of the secret.

// Get secrets command: firebase functions:secrets:access THE_NAME_OF_THE_SECRET

// See all the secret names: gcloud secrets list