/**
 * Retries a promise-returning operation with exponential backoff.
 * 
 * @param operation The function to retry
 * @param maxRetries Maximum number of retries (default: 3)
 * @param baseDelay Base delay in ms (default: 1000)
 */

// FIXED #37: Type guard for Firestore-like errors
interface FirestoreError {
  code: string;
  message: string;
}

function isFirestoreError(error: unknown): error is FirestoreError {
  return typeof error === 'object' && error !== null && 'code' in error;
}

export async function retryOperation<T>(
  operation: () => Promise<T>, 
  maxRetries = 3, 
  baseDelay = 1000
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: unknown) {
      lastError = error;
      
      // Don't retry if it's not a transient error
      // Usually 'unavailable' or 'deadline-exceeded' are retryable.
      // 'permission-denied' is not.
      let isRetryable = true;
      
      if (isFirestoreError(error)) {
        isRetryable = 
          error.code === 'unavailable' || 
          error.code === 'deadline-exceeded' ||
          error.code === 'resource-exhausted';
      }

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

