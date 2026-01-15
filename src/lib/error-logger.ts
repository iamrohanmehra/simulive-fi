import * as Sentry from '@sentry/react';
import { logEvent } from './analytics';

type ErrorCategory = 'network' | 'auth' | 'video' | 'ui' | 'unknown';

interface ErrorContext {
  userId?: string | null;
  sessionId?: string;
  action?: string;
  // FIXED #36: Use unknown instead of any for index signature
  [key: string]: unknown;
}

// Configuration
const SENTRY_RATE_LIMIT = 10; // Max errors sent to Sentry per minute
const DEDUP_WINDOW_MS = 10000; // 10 seconds dedup window for identical errors

// State
const sentryErrorCounts: number[] = []; // Timestamp of errors sent to Sentry
const recentErrors = new Map<string, number>(); // Fingerprint -> Timestamp

/**
 * Generate a simple fingerprint for an error
 */
const getErrorFingerprint = (error: Error, category: ErrorCategory): string => {
  return `${category}:${error.name}:${error.message}:${error.stack?.substring(0, 100) || ''}`;
};

/**
 * Categorize error based on type or message
 */
const categorizeError = (error: Error): ErrorCategory => {
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('offline') || message.includes('fetch') || message.includes('firestore')) {
    return 'network';
  }
  if (message.includes('auth') || message.includes('permission') || message.includes('firebase: error (auth')) {
    return 'auth';
  }
  if (message.includes('video') || message.includes('media') || message.includes('playback') || message.includes('hls')) {
    return 'video';
  }
  if (message.includes('render') || message.includes('react') || message.includes('dom')) {
    return 'ui';
  }
  
  return 'unknown';
};

/**
 * Check if we should send to Sentry based on rate limit
 */
const shouldSendToSentry = (): boolean => {
  const now = Date.now();
  // Remove timestamps older than 1 minute
  while (sentryErrorCounts.length > 0 && sentryErrorCounts[0] < now - 60000) {
    sentryErrorCounts.shift();
  }
  
  if (sentryErrorCounts.length < SENTRY_RATE_LIMIT) {
    sentryErrorCounts.push(now);
    return true;
  }
  return false;
};

/**
 * Check if this is a duplicate error
 */
const isDuplicate = (fingerprint: string): boolean => {
  const now = Date.now();
  const lastTime = recentErrors.get(fingerprint);
  
  if (lastTime && now - lastTime < DEDUP_WINDOW_MS) {
    return true;
  }
  
  recentErrors.set(fingerprint, now);
  // Cleanup old entries occasionally (simple check: if map gets too big)
  if (recentErrors.size > 100) {
    for (const [key, time] of recentErrors.entries()) {
      if (now - time > DEDUP_WINDOW_MS) {
        recentErrors.delete(key);
      }
    }
  }
  return false;
};

/**
 * Centralized error logging function
 */
export const logError = (error: Error, context: ErrorContext = {}) => {
  try {
    const category = categorizeError(error);
    const fingerprint = getErrorFingerprint(error, category);
    
    if (isDuplicate(fingerprint)) {
      if (import.meta.env.DEV) {
        console.debug('[ErrorLogger] Duplicate error suppressed:', error.message);
      }
      return;
    }

    const errorInfo = {
      message: error.message,
      name: error.name,
      category,
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      ...context
    };

    // 1. Console Logging (Always in Dev, Warn in Prod)
    if (import.meta.env.DEV) {
      console.groupCollapsed(`[ErrorLogger] ${category.toUpperCase()}: ${error.message}`);
      console.error(error);
      console.table(errorInfo);
      console.groupEnd();
    } else {
      console.warn(`[Error] ${error.message}`, context);
    }

    // 2. Firebase Analytics
    // Note: Firebase Analytics automatically captures some errors, but we add a custom event
    // We map to 'app_exception' or custom 'app_error'
    logEvent({
      name: 'app_error',
      params: { 
        category,
        message: error.message,
        session_id: context.sessionId,
        action: context.action
      }
    });

    // 3. Sentry
    if (shouldSendToSentry()) {
      Sentry.withScope((scope) => {
        scope.setTag('category', category);
        if (context.sessionId) scope.setTag('session_id', context.sessionId);
        if (context.userId) scope.setUser({ id: context.userId });
        if (context.action) scope.setTag('action', context.action);
        
        scope.setExtras(context);
        
        Sentry.captureException(error);
      });
    } else {
      if (import.meta.env.DEV) {
        console.warn('[ErrorLogger] Sentry rate limit reached');
      }
    }

  } catch (loggingError) {
    // Fail safe
    console.error('Failed to log error:', loggingError);
    console.error('Original error:', error);
  }
};
