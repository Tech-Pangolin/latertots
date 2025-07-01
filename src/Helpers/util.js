

/**
 * Calculates the age based on the given date of birth.
 *
 * @param {string} dob - The date of birth in the format "YYYY-MM-DD".
 * @returns {number} The calculated age.
 */
export function calculateAge(dob) {
  const birthDate = ifTimestampMakeDate(dob);            // TODO: make sure the date format coming in is consistent
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
  }
  return age;
}


/**
 * Converts a timestamp or date-like object to a JavaScript Date object.
 *
 * If the input has a `toDate` method (e.g., a Firestore Timestamp), it calls that method.
 * Otherwise, it creates a new Date object from the input.
 *
 * @param {any} ts - The timestamp or date-like object to convert.
 * @returns {Date} The resulting JavaScript Date object.
 */
export function ifTimestampMakeDate(ts) {
  return ts.toDate ? ts.toDate() : new Date(ts);
}

/**
 * Sets a timeout for a function to be called after a delay.
 * 
 * @param {function} fn - The function to be called.
 * @param {number} delay - The delay in milliseconds.
 * @returns none
 */
export const debounce = (fn, delay) => {
  let timer = null;

  return (...args) => {
    // Clear the existing timer
    if (timer) clearTimeout(timer);

    // Set a new timer
    timer = setTimeout(() => {
      fn(...args); // Call the debounced function with the latest arguments
    }, delay);
  };
};


