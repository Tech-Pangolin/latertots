
/**
 * Calculates the age based on the given date of birth.
 *
 * @param {string} dob - The date of birth in the format "YYYY-MM-DD".
 * @returns {number} The calculated age.
 */
export function calculateAge(dob) {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
  }
  return age;
}

