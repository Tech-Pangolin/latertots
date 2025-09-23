/**
 * Executes a function with exponential backoff retry logic.
 * 
 * @param {Function} operation - The async function to retry
 * @param {Object} options - Retry configuration options
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.baseDelay - Base delay in milliseconds (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in milliseconds (default: 10000)
 * @param {number} options.backoffMultiplier - Multiplier for exponential backoff (default: 2)
 * @param {Function} options.shouldRetry - Function to determine if error should trigger retry (default: retry all errors)
 * @param {Function} options.onRetry - Optional callback called on each retry attempt
 * @returns {Promise} - Promise that resolves with operation result or rejects with final error
 */
export const withBackoffRetry = async (operation, options = {}) => {
  const config = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    shouldRetry: () => true,
    onRetry: null,
    ...options
  };

  const { maxRetries, baseDelay, maxDelay, backoffMultiplier, shouldRetry, onRetry } = config;
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry if this is the last attempt or error shouldn't be retried
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelay * Math.pow(backoffMultiplier, attempt) + Math.random() * 1000,
        maxDelay
      );
      
      // Call retry callback if provided
      if (onRetry) {
        onRetry(error, attempt + 1, delay);
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

/**
 * Specialized retry helper for Firebase operations that may fail due to timing issues.
 * Includes common retry logic for permission errors and network issues.
 */
export const withFirebaseRetry = async (operation, options = {}) => {
  return withBackoffRetry(operation, {
    maxRetries: 5,
    baseDelay: 500,
    maxDelay: 5000,
    shouldRetry: (error) => {
      // Retry on permission errors, network errors, and unavailable errors
      const retryableErrors = [
        'permission-denied',
        'unavailable',
        'deadline-exceeded',
        'internal',
        'network-request-failed'
      ];
      
      return retryableErrors.some(errorCode => 
        error.code === errorCode || 
        error.message?.toLowerCase().includes(errorCode)
      );
    },
    onRetry: (error, attempt, delay) => {
      console.warn(`Firebase operation failed, retrying in ${delay}ms (attempt ${attempt}):`, error.message);
    },
    ...options
  });
};
