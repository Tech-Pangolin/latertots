const { onRequest } = require('firebase-functions/v2/https');
const logger = require('firebase-functions/logger');

exports.processRefund = onRequest(
  { secrets: [require('../../config').stripeSecretKey] },
  async (req, res) => {
    const { stripeSecretKey } = require('../../config');

    try {
      const { invoiceId, amount, reason } = req.body;

      logger.info('💰 [fxn:processRefund]: Processing refund', {
        invoiceId,
        amount,
        reason,
        timestamp: new Date().toISOString()
      });

      // Process refund
      const { processRefund } = require('../helpers/stripeHelpers');
      const { markInvoiceRefunded } = require('../../status/helpers/invoiceStatusHelpers');
      const { markReservationCancelled } = require('../../status/helpers/reservationStatusHelpers');

      const refundResult = await processRefund(invoiceId, amount, reason, stripeSecretKey.value());
      await markInvoiceRefunded(invoiceId, { refundId: refundResult.id, amount, reason });

      // Get reservation and mark as cancelled
      const { getReservationByInvoice } = require('../../status/helpers/reservationStatusHelpers');
      const reservation = await getReservationByInvoice(invoiceId);
      await markReservationCancelled(reservation.id, `Refunded: ${reason}`);

      logger.info('✅ [fxn:processRefund]: Refund processed successfully', {
        invoiceId,
        refundId: refundResult.id,
        timestamp: new Date().toISOString()
      });

      res.status(200).json({
        success: true,
        refundId: refundResult.id,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('❌ [fxn:processRefund]: Refund processing failed', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });
