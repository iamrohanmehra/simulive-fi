import { collection, doc, CollectionReference, DocumentReference } from 'firebase/firestore';
import { db } from './firebase';
import type { User, Session, Message, ViewerSession, ActiveSession, SessionAnalytics } from './types';

/**
 * Collection reference helpers
 * These provide typed references to Firestore collections
 */

export const usersCollection = collection(db, 'users') as CollectionReference<User>;

export const sessionsCollection = collection(db, 'sessions') as CollectionReference<Session>;

export const messagesCollection = (sessionId: string) => 
  collection(db, 'sessions', sessionId, 'messages') as CollectionReference<Message>;

export const viewerSessionsCollection = collection(db, 'viewer_sessions') as CollectionReference<ViewerSession>;

export const activeSessionsCollection = collection(db, 'active_sessions') as CollectionReference<ActiveSession>;

export const sessionAnalyticsCollection = collection(db, 'session_analytics') as CollectionReference<SessionAnalytics>;

/**
 * Document path helpers
 * These provide typed references to specific documents
 */

export const userDoc = (userId: string): DocumentReference<User> => 
  doc(db, 'users', userId) as DocumentReference<User>;

export const sessionDoc = (sessionId: string): DocumentReference<Session> => 
  doc(db, 'sessions', sessionId) as DocumentReference<Session>;

export const messageDoc = (sessionId: string, messageId: string): DocumentReference<Message> => 
  doc(db, 'sessions', sessionId, 'messages', messageId) as DocumentReference<Message>;

export const viewerSessionDoc = (viewerSessionId: string): DocumentReference<ViewerSession> => 
  doc(db, 'viewer_sessions', viewerSessionId) as DocumentReference<ViewerSession>;

export const activeSessionDoc = (sessionId: string): DocumentReference<ActiveSession> => 
  doc(db, 'active_sessions', sessionId) as DocumentReference<ActiveSession>;

export const sessionAnalyticsDoc = (sessionId: string): DocumentReference<SessionAnalytics> => 
  doc(db, 'session_analytics', sessionId) as DocumentReference<SessionAnalytics>;
