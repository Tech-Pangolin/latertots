/**
 * Format a Firestore Timestamp object to a locale date string
 * @param {Object} timestamp - Firestore Timestamp object (can be Timestamp object or plain object with _seconds)
 * @returns {string} - Formatted date string
 */
export const formatFirestoreTimestamp = (timestamp) => {
  if (!timestamp) {
    return 'Invalid Date';
  }
  
  // Handle Firestore Timestamp object (has toDate method)
  if (timestamp.toDate && typeof timestamp.toDate === 'function') {
    return timestamp.toDate().toLocaleDateString();
  }
  
  // Handle plain object with _seconds (from payment history)
  if (timestamp._seconds) {
    return new Date(timestamp._seconds * 1000).toLocaleDateString();
  }
  
  return 'Invalid Date';
};

/**
 * Format a Unix timestamp (seconds) to a locale date string
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {string} - Formatted date string
 */
export const formatUnixTimestamp = (timestamp) => {
  if (!timestamp || typeof timestamp !== 'number') {
    return 'Invalid Date';
  }
  return new Date(timestamp * 1000).toLocaleDateString();
};
