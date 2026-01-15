/**
 * Retries a promise-returning operation with exponential backoff.
 * 
 * @param operation The function to retry
 * @param maxRetries Maximum number of retries (default: 3)
 * @param baseDelay Base delay in ms (default: 1000)
 */
export async function retryOperation<T>(
  operation: () => Promise<T>, 
  maxRetries = 3, 
  baseDelay = 1000
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry if it's not a transient error (optional refinenement)
      // Usually 'unavailable' or 'deadline-exceeded' are retryable.
      // 'permission-denied' is not.
      const isRetryable = 
        !error.code || // Generic error
        error.code === 'unavailable' || 
        error.code === 'deadline-exceeded' ||
        error.code === 'resource-exhausted';

      if (!isRetryable || attempt === maxRetries) {
        throw error;
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 100,
        30000 // Max 30s delay
      );
      
      console.warn(`Operation failed, retrying in ${Math.round(delay)}ms... (Attempt ${attempt + 1}/${maxRetries})`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}
