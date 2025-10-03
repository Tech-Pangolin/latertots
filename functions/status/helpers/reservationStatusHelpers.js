// reservationStatusHelpers.js - Reservation status update helpers
const admin = require('firebase-admin');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const logger = require('firebase-functions/logger');
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

// Legacy invoice functions removed

module.exports = {
  updateReservationStatus,
  markReservationCompleted,
  markReservationCancelled,
  getReservationStatus
};
