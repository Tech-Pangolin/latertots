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


module.exports = {
  // Secrets (from Secret Manager)
  stripeSecretKey,
  stripeWebhookSecret,
  latertotsEmail,
  emailPasscode,
};
