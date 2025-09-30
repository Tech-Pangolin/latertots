// invoiceStatusHelpers.js - Invoice status update helpers
const admin = require('firebase-admin');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const logger = require('firebase-functions/logger');
const { INVOICE_STATUS } = require('../../constants');

const db = getFirestore();

/**
 * Update invoice status with payment details
 * @param {string} invoiceId - Invoice ID
 * @param {string} newStatus - New invoice status
 * @param {Object} paymentDetails - Payment details
 * @returns {Promise<Object>} - Update result
 */
const updateInvoiceStatus = async (invoiceId, newStatus, paymentDetails = {}) => {
  try {
    const updateData = {
      status: newStatus,
      updatedAt: Timestamp.now()
    };
    
    // Add payment details if provided
    if (paymentDetails.paymentIntentId) {
      updateData.stripePaymentIntentId = paymentDetails.paymentIntentId;
    }
    
    if (paymentDetails.paymentMethod) {
      updateData.paymentMethod = paymentDetails.paymentMethod;
    }
    
    if (paymentDetails.paidAt) {
      updateData.paidAt = paymentDetails.paidAt;
    }
    
    if (paymentDetails.failureReason) {
      updateData.failureReason = paymentDetails.failureReason;
    }
    
    await db.collection('Invoices').doc(invoiceId).update(updateData);
    
    logger.info('✅ [STATUS] Updated invoice status:', {
      invoiceId,
      newStatus,
      paymentDetails
    });
    
    return { success: true, invoiceId, newStatus };
  } catch (error) {
    logger.error('❌ [STATUS] Failed to update invoice status:', {
      invoiceId,
      newStatus,
      error: error.message
    });
    throw error;
  }
};

/**
 * Mark invoice as paid
 * @param {string} invoiceId - Invoice ID
 * @param {Object} paymentDetails - Payment details
 * @returns {Promise<Object>} - Update result
 */
const markInvoicePaid = async (invoiceId, paymentDetails = {}) => {
  return await updateInvoiceStatus(invoiceId, INVOICE_STATUS.PAID, {
    ...paymentDetails,
    paidAt: Timestamp.now()
  });
};

/**
 * Mark invoice as late
 * @param {string} invoiceId - Invoice ID
 * @returns {Promise<Object>} - Update result
 */
const markInvoiceLate = async (invoiceId) => {
  return await updateInvoiceStatus(invoiceId, INVOICE_STATUS.LATE);
};

/**
 * Mark invoice as unpaid (for failed payments)
 * @param {string} invoiceId - Invoice ID
 * @param {string} failureReason - Reason for failure
 * @returns {Promise<Object>} - Update result
 */
const markInvoiceUnpaid = async (invoiceId, failureReason = 'Payment failed') => {
  return await updateInvoiceStatus(invoiceId, INVOICE_STATUS.UNPAID, {
    failureReason
  });
};

/**
 * Mark invoice as refunded
 * @param {string} invoiceId - Invoice ID
 * @param {Object} refundDetails - Refund details
 * @returns {Promise<Object>} - Update result
 */
const markInvoiceRefunded = async (invoiceId, refundDetails = {}) => {
  return await updateInvoiceStatus(invoiceId, INVOICE_STATUS.CANCELLED, {
    ...refundDetails,
    refundedAt: Timestamp.now()
  });
};

/**
 * Get invoice status
 * @param {string} invoiceId - Invoice ID
 * @returns {Promise<string>} - Current invoice status
 */
const getInvoiceStatus = async (invoiceId) => {
  try {
    const invoiceDoc = await db.collection('Invoices').doc(invoiceId).get();
    
    if (!invoiceDoc.exists) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }
    
    return invoiceDoc.data().status;
  } catch (error) {
    logger.error('❌ [STATUS] Failed to get invoice status:', {
      invoiceId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Check if invoice is overdue
 * @param {string} invoiceId - Invoice ID
 * @returns {Promise<boolean>} - Whether invoice is overdue
 */
const isInvoiceOverdue = async (invoiceId) => {
  try {
    const invoiceDoc = await db.collection('Invoices').doc(invoiceId).get();
    
    if (!invoiceDoc.exists) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }
    
    const invoice = invoiceDoc.data();
    const now = new Date();
    const dueDate = invoice.dueDate.toDate();
    
    return now > dueDate && invoice.status === INVOICE_STATUS.UNPAID;
  } catch (error) {
    logger.error('❌ [STATUS] Failed to check if invoice is overdue:', {
      invoiceId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Get all overdue invoices
 * @returns {Promise<Array>} - Array of overdue invoices
 */
const getOverdueInvoices = async () => {
  try {
    const now = Timestamp.now();
    
    const overdueInvoices = await db
      .collection('Invoices')
      .where('status', '==', INVOICE_STATUS.UNPAID)
      .where('dueDate', '<', now)
      .get();
    
    logger.info('📅 [STATUS] Found overdue invoices:', {
      count: overdueInvoices.size
    });
    
    return overdueInvoices.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    logger.error('❌ [STATUS] Failed to get overdue invoices:', {
      error: error.message
    });
    throw error;
  }
};

module.exports = {
  updateInvoiceStatus,
  markInvoicePaid,
  markInvoiceLate,
  markInvoiceUnpaid,
  markInvoiceRefunded,
  getInvoiceStatus,
  isInvoiceOverdue,
  getOverdueInvoices
};
