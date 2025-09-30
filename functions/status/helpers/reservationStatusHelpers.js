// reservationStatusHelpers.js - Reservation status update helpers
const admin = require('firebase-admin');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const { logger } = require('firebase-functions');
const { RESERVATION_STATUS } = require('../../constants');

const db = getFirestore();

/**
 * Update reservation status
 * @param {string} reservationId - Reservation ID
 * @param {string} newStatus - New reservation status
 * @param {Object} updateData - Additional update data
 * @returns {Promise<Object>} - Update result
 */
const updateReservationStatus = async (reservationId, newStatus, updateData = {}) => {
  try {
    const updatePayload = {
      status: newStatus,
      updatedAt: Timestamp.now(),
      ...updateData
    };
    
    await db.collection('Reservations').doc(reservationId).update(updatePayload);
    
    logger.info('✅ [STATUS] Updated reservation status:', {
      reservationId,
      newStatus
    });
    
    return { success: true, reservationId, newStatus };
  } catch (error) {
    logger.error('❌ [STATUS] Failed to update reservation status:', {
      reservationId,
      newStatus,
      error: error.message
    });
    throw error;
  }
};

/**
 * Mark reservation as completed (when invoice is paid)
 * @param {string} reservationId - Reservation ID
 * @returns {Promise<Object>} - Update result
 */
const markReservationCompleted = async (reservationId) => {
  return await updateReservationStatus(reservationId, RESERVATION_STATUS.COMPLETED);
};

/**
 * Mark reservation as cancelled
 * @param {string} reservationId - Reservation ID
 * @param {string} reason - Cancellation reason
 * @returns {Promise<Object>} - Update result
 */
const markReservationCancelled = async (reservationId, reason = 'Cancelled') => {
  return await updateReservationStatus(reservationId, RESERVATION_STATUS.CANCELLED, {
    cancellationReason: reason,
    cancelledAt: Timestamp.now()
  });
};

/**
 * Get reservation status
 * @param {string} reservationId - Reservation ID
 * @returns {Promise<string>} - Current reservation status
 */
const getReservationStatus = async (reservationId) => {
  try {
    const reservationDoc = await db.collection('Reservations').doc(reservationId).get();
    
    if (!reservationDoc.exists) {
      throw new Error(`Reservation ${reservationId} not found`);
    }
    
    return reservationDoc.data().status;
  } catch (error) {
    logger.error('❌ [STATUS] Failed to get reservation status:', {
      reservationId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Sync reservation status with invoice status
 * @param {string} reservationId - Reservation ID
 * @param {string} invoiceStatus - Invoice status
 * @returns {Promise<Object>} - Sync result
 */
const syncReservationWithInvoice = async (reservationId, invoiceStatus) => {
  try {
    let newReservationStatus;
    
    switch (invoiceStatus) {
      case 'paid':
        newReservationStatus = RESERVATION_STATUS.COMPLETED;
        break;
      case 'unpaid':
      case 'late':
        newReservationStatus = RESERVATION_STATUS.PROCESSING;
        break;
      case 'cancelled':
        newReservationStatus = RESERVATION_STATUS.CANCELLED;
        break;
      default:
        logger.warn('⚠️ [STATUS] Unknown invoice status for sync:', {
          reservationId,
          invoiceStatus
        });
        return { success: false, reason: 'unknown_invoice_status' };
    }
    
    return await updateReservationStatus(reservationId, newReservationStatus);
  } catch (error) {
    logger.error('❌ [STATUS] Failed to sync reservation with invoice:', {
      reservationId,
      invoiceStatus,
      error: error.message
    });
    throw error;
  }
};

/**
 * Get reservation by invoice ID
 * @param {string} invoiceId - Invoice ID
 * @returns {Promise<Object>} - Reservation data
 */
const getReservationByInvoice = async (invoiceId) => {
  try {
    const invoiceDoc = await db.collection('Invoices').doc(invoiceId).get();
    
    if (!invoiceDoc.exists) {
      throw new Error(`Invoice ${invoiceId} not found`);
    }
    
    const invoice = invoiceDoc.data();
    const reservationId = invoice.reservationId;
    
    if (!reservationId) {
      throw new Error(`No reservation linked to invoice ${invoiceId}`);
    }
    
    const reservationDoc = await db.collection('Reservations').doc(reservationId).get();
    
    if (!reservationDoc.exists) {
      throw new Error(`Reservation ${reservationId} not found`);
    }
    
    return {
      id: reservationDoc.id,
      ...reservationDoc.data()
    };
  } catch (error) {
    logger.error('❌ [STATUS] Failed to get reservation by invoice:', {
      invoiceId,
      error: error.message
    });
    throw error;
  }
};

module.exports = {
  updateReservationStatus,
  markReservationCompleted,
  markReservationCancelled,
  getReservationStatus,
  syncReservationWithInvoice,
  getReservationByInvoice
};
