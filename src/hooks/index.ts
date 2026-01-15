/**
 * FIXED #43: Consistent hooks exports from central index
 * 
 * All hooks can now be imported from '@/hooks' for consistency.
 * Individual imports still work: '@/hooks/useChat'
 */

// Auth & Session
export { useAuth } from '@/contexts/AuthContext';
export { default as useSessionState } from './useSessionState';
export { default as useViewerTracking } from './useViewerTracking';
export { default as useCurrentViewers } from './useCurrentViewers';

// Chat
export { default as useChat } from './useChat';
export { default as useAutoScroll } from './useAutoScroll';

// Polls
export { default as usePollSync } from './usePollSync';

// Video & Server Time
export { default as useServerTimeSync } from './useServerTimeSync';

// Utilities
export { default as useKeyboardShortcuts } from './useKeyboardShortcuts';
export { useNetworkStatus } from './useNetworkStatus';
export { usePageTracking } from './usePageTracking';
