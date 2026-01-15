import { getAnalytics, logEvent as firebaseLogEvent } from 'firebase/analytics';
import { app } from './firebase';

let analytics: any = null;

if (import.meta.env.PROD) {
  analytics = getAnalytics(app);
}

export type AnalyticsEvent = 
  | { name: 'session_joined'; params: { session_id: string; user_id?: string | null } }
  | { name: 'message_sent'; params: { session_id: string } }
  | { name: 'poll_created'; params: { session_id: string; question: string } }
  | { name: 'poll_voted'; params: { poll_id: string; option: string } }
  | { name: 'broadcast_sent'; params: { session_id: string } }
  | { name: 'session_ended'; params: { session_id: string; duration?: number } }
  | { name: 'admin_action'; params: { action_type: string; session_id: string } };

export const logEvent = (event: AnalyticsEvent) => {
  if (import.meta.env.PROD && analytics) {
    try {
      firebaseLogEvent(analytics, event.name, event.params);
    } catch (error) {
      console.error('Failed to log analytics event:', error);
    }
  } else {
    // In dev, we can optionally log to console to verify tracking
    console.log(`[Analytics] ${event.name}`, event.params);
  }
};
