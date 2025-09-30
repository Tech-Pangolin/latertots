const { onRequest } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');

exports.stripeWebhook = onRequest(
  {
    secrets: [require('../../config').stripeSecretKey, require('../../config').stripeWebhookSecret],
    cors: false,  // Disable CORS to preserve raw body
    rawBody: true  // Enable raw body access for signature verification
  },
  async (req, res) => {
    const { stripeSecretKey, stripeWebhookSecret } = require('../../config');

    logger.info('🔔 [fxn:stripeWebhook]: Stripe webhook received', {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    });

    try {
      // Verify webhook signature for security
      const { verifyWebhookSignature, processStripeWebhook } = require('../helpers/webhookHelpers');
      const signature = req.headers['stripe-signature'] || req.headers['Stripe-Signature'];

      if (!signature) {
        logger.error('❌ [fxn:stripeWebhook]: Missing Stripe signature header');
        return res.status(400).json({
          success: false,
          error: 'Missing Stripe signature header'
        });
      }

      const rawBody = Buffer.isBuffer(req.rawBody)
        ? req.rawBody.toString('utf8')
        : req.rawBody || JSON.stringify(req.body);

      if (!rawBody) {
        logger.error('❌ [fxn:stripeWebhook]: No raw body available for signature verification');
        return res.status(400).json({
          success: false,
          error: 'No raw body available for signature verification'
        });
      }

      // Verify and parse the webhook
      const stripeEvent = verifyWebhookSignature(rawBody, signature, stripeSecretKey.value(), stripeWebhookSecret.value());

      // Process Stripe webhook
      const result = await processStripeWebhook(stripeEvent);

      logger.info('✅ [fxn:stripeWebhook]: Webhook processed successfully', {
        eventType: stripeEvent.type,
        eventId: stripeEvent.id
      });

      res.status(200).json({
        success: true,
        processed: result.processed
      });

    } catch (error) {
      logger.error('❌ [fxn:stripeWebhook]: Webhook processing failed', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  });
