import { withBackoffRetry, withFirebaseRetry } from '../../Helpers/retryHelpers';

// Mock setTimeout to avoid actual delays in tests
jest.useFakeTimers();

describe('retryHelpers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('withBackoffRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      
      const result = await withBackoffRetry(mockOperation);
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success');
      
      const resultPromise = withBackoffRetry(mockOperation, { 
        maxRetries: 2,
        baseDelay: 10 // Use very small delay for testing
      });
      
      // Fast-forward through delays
      jest.runAllTimers();
      
      const result = await resultPromise;
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Persistent failure'));
      
      const resultPromise = withBackoffRetry(mockOperation, { 
        maxRetries: 2,
        baseDelay: 10 // Use very small delay for testing
      });
      
      // Fast-forward through delays
      jest.runAllTimers();
      
      await expect(resultPromise).rejects.toThrow('Persistent failure');
      expect(mockOperation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should respect shouldRetry function', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Non-retryable error'));
      
      const shouldRetry = jest.fn().mockReturnValue(false);
      
      const resultPromise = withBackoffRetry(mockOperation, { shouldRetry });
      
      await expect(resultPromise).rejects.toThrow('Non-retryable error');
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(shouldRetry).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should call onRetry callback', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValue('success');
      
      const onRetry = jest.fn();
      
      const resultPromise = withBackoffRetry(mockOperation, { 
        onRetry,
        baseDelay: 10 // Use very small delay for testing
      });
      
      // Fast-forward through delays
      jest.runAllTimers();
      
      await resultPromise;
      
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(
        expect.any(Error),
        1, // attempt number
        expect.any(Number) // delay
      );
    });

    it('should use custom configuration', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Failure'));
      
      const resultPromise = withBackoffRetry(mockOperation, {
        maxRetries: 1,
        baseDelay: 10, // Use very small delay for testing
        backoffMultiplier: 3
      });
      
      // Fast-forward through delays
      jest.runAllTimers();
      
      await expect(resultPromise).rejects.toThrow('Failure');
      expect(mockOperation).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });

    it('should merge options correctly with defaults', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      
      // Test that custom options override defaults
      const result = await withBackoffRetry(mockOperation, {
        maxRetries: 1,
        baseDelay: 500
      });
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe('withFirebaseRetry', () => {
    it('should retry on Firebase permission errors', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce({ code: 'permission-denied', message: 'Permission denied' })
        .mockResolvedValue('success');
      
      const resultPromise = withFirebaseRetry(mockOperation, { baseDelay: 10 });
      
      // Fast-forward through delays
      jest.runAllTimers();
      
      const result = await resultPromise;
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-Firebase errors', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Validation error'));
      
      const resultPromise = withFirebaseRetry(mockOperation);
      
      await expect(resultPromise).rejects.toThrow('Validation error');
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry on network errors', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce({ message: 'network-request-failed' })
        .mockResolvedValue('success');
      
      const resultPromise = withFirebaseRetry(mockOperation, { baseDelay: 10 });
      
      // Fast-forward through delays
      jest.runAllTimers();
      
      const result = await resultPromise;
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should retry on unavailable errors', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce({ code: 'unavailable', message: 'Service unavailable' })
        .mockResolvedValue('success');
      
      const resultPromise = withFirebaseRetry(mockOperation, { baseDelay: 10 });
      
      // Fast-forward through delays
      jest.runAllTimers();
      
      const result = await resultPromise;
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should retry on deadline-exceeded errors', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce({ code: 'deadline-exceeded', message: 'Request timeout' })
        .mockResolvedValue('success');
      
      const resultPromise = withFirebaseRetry(mockOperation, { baseDelay: 10 });
      
      // Fast-forward through delays
      jest.runAllTimers();
      
      const result = await resultPromise;
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should retry on internal errors', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce({ code: 'internal', message: 'Internal server error' })
        .mockResolvedValue('success');
      
      const resultPromise = withFirebaseRetry(mockOperation, { baseDelay: 10 });
      
      // Fast-forward through delays
      jest.runAllTimers();
      
      const result = await resultPromise;
      
      expect(result).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should fail after max retries on Firebase errors', async () => {
      const mockOperation = jest.fn().mockRejectedValue({ code: 'permission-denied', message: 'Permission denied' });
      
      const resultPromise = withFirebaseRetry(mockOperation, { 
        maxRetries: 2,
        baseDelay: 10
      });
      
      // Fast-forward through delays
      jest.runAllTimers();
      
      await expect(resultPromise).rejects.toMatchObject({
        code: 'permission-denied',
        message: 'Permission denied'
      });
      expect(mockOperation).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should allow custom options to override Firebase defaults', async () => {
      const mockOperation = jest.fn().mockRejectedValue({ code: 'permission-denied', message: 'Permission denied' });
      
      const resultPromise = withFirebaseRetry(mockOperation, { 
        maxRetries: 1,
        baseDelay: 10
      });
      
      // Fast-forward through delays
      jest.runAllTimers();
      
      await expect(resultPromise).rejects.toMatchObject({
        code: 'permission-denied',
        message: 'Permission denied'
      });
      expect(mockOperation).toHaveBeenCalledTimes(2); // Initial + 1 retry
    });
  });
});
