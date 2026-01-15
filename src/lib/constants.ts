/**
 * Application-wide constants
 * FIXED: Magic numbers extracted to named constants
 */

// Message rate limiting
export const MESSAGE_COOLDOWN_MS = 6000;
export const MAX_MESSAGE_LENGTH = 500;

// Video sync constants
export const DRIFT_THRESHOLD_SECONDS = 0.25;
export const SYNC_INTERVAL_MS = 5000;

// Server time sync constants
export const SERVER_SYNC_INTERVAL_MS = 30000;
export const SERVER_TIME_CACHE_DURATION_MS = 5 * 60 * 1000;

// Error logging constants
export const SENTRY_RATE_LIMIT = 10;
export const ERROR_DEDUP_WINDOW_MS = 10000;

// Viewer tracking
export const VIEWER_POLL_INTERVAL_MS = 10000;

// Chat
export const CHAT_MESSAGE_LIMIT = 50;
export const CHAT_CACHE_DURATION_MS = 10000;

// Poll
export const POLL_GRACE_PERIOD_MS = 10000;
