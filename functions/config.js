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

// Non-sensitive configuration with defaults
const logLevel = defineString('LOG_LEVEL', { default: 'INFO' });
const maxRetryAttempts = defineInt('MAX_RETRY_ATTEMPTS', { default: 3 });
const retryIntervalHours = defineInt('RETRY_INTERVAL_HOURS', { default: 24 }); 

module.exports = {
  // Secrets (from Secret Manager)
  stripeSecretKey,
  stripeWebhookSecret,
  latertotsEmail,
  emailPasscode,
  
  // Configuration (with defaults)
  logLevel,
  maxRetryAttempts,
  retryIntervalHours
};
