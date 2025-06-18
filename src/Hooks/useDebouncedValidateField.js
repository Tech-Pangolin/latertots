import { useCallback, useRef } from "react";
import _ from "lodash";

/**
 * A custom hook that provides a debounced validation function for form fields.
 *
 * @param {Function} validateFn - A pure, synchronous function that takes in form data and a field name,
 *                                 and returns an error object with any new errors for that field.
 *                                 Example: `validateFn(formData, fieldName) {...}`
 * @param {Function} setErrors - A state setter function to update the form errors.
 * @param {number} [delay=500] - The debounce delay in milliseconds. Default is 500ms.
 * 
 * @returns {Function} A debounced function that can be called to validate a specific form field.
 */
export default function useDebouncedValidateField(validateFn, setErrors, delay = 500) {

  // Debounced, memoized validator
  const debouncedValidator = useRef(
    _.debounce((formData, field) => {
      setErrors(prev => {
        const prevErrorsCopy = { ...prev };
        delete prevErrorsCopy[field]; // Remove the field from previous errors to avoid stale errors
        return { ...prevErrorsCopy, ...validateFn(formData, field) };
      });
    }, delay)
  ).current;

  // Expose a stable function to invoke the debounced validator
  const debouncedValidateField = useCallback(
    (formData, field) => {
      debouncedValidator(formData, field);
    },
    [debouncedValidator]
  );

  return debouncedValidateField;
}