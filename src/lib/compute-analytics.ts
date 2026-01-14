import { getDocs, query, where, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { 
  viewerSessionsCollection, 
  messagesCollection, 
  sessionAnalyticsDoc 
} from './firestore-collections';
import type { SessionAnalytics } from './types';

/**
 * Computes and saves analytics for a given session.
 * Calculates total viewers, peak concurrent viewers, average watch time, etc.
 */
export default async function computeSessionAnalytics(sessionId: string): Promise<SessionAnalytics> {
  // 1. Fetch all viewer sessions
  const viewersSnapshot = await getDocs(
    query(viewerSessionsCollection, where('sessionId', '==', sessionId))
  );
  
  const viewerSessions = viewersSnapshot.docs.map(doc => doc.data());
  
  // 2. Fetch all messages
  const messagesSnapshot = await getDocs(messagesCollection(sessionId));
  const messages = messagesSnapshot.docs.map(doc => doc.data());

  // 3. specific metrics
  const totalViewers = viewerSessions.length;
  const totalMessages = messages.length;
  
  // Unique chatters
  const uniqueChatterIds = new Set(messages.map(m => m.userId));
  const uniqueChatters = uniqueChatterIds.size;

  // Avg Watch Time
  let totalDurationSeconds = 0;
  viewerSessions.forEach(session => {
    const joined = session.joinedAt ? (session.joinedAt as unknown as Timestamp).toDate() : new Date();
    // If leftAt is null, use now (assuming session just ended or is ending)
    const left = session.leftAt ? (session.leftAt as unknown as Timestamp).toDate() : new Date();
    
    const duration = (left.getTime() - joined.getTime()) / 1000;
    if (duration > 0) totalDurationSeconds += duration;
  });
  
  const avgWatchTime = totalViewers > 0 ? totalDurationSeconds / totalViewers : 0;

  // Peak Concurrent Viewers
  // Algorithm: Create events (join=+1, left=-1), sort by time, scan.
  const events: { time: number; type: 'join' | 'left' }[] = [];
  
  viewerSessions.forEach(session => {
    const joined = session.joinedAt ? (session.joinedAt as unknown as Timestamp).toDate().getTime() : Date.now();
    const left = session.leftAt ? (session.leftAt as unknown as Timestamp).toDate().getTime() : Date.now();
    
    events.push({ time: joined, type: 'join' });
    events.push({ time: left, type: 'left' });
  });

  // Sort events: time asc. 
  // If times are equal, standard approach for peak *concurrent* is often join before leave to capture overlap.
  events.sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time;
    // If times match, process join first to be inclusive of that moment
    return a.type === 'join' ? -1 : 1; 
  });

  let currentViewers = 0;
  let peakViewers = 0;

  for (const event of events) {
    if (event.type === 'join') {
      currentViewers++;
    } else {
      currentViewers--;
    }
    if (currentViewers > peakViewers) peakViewers = currentViewers;
  }

  const computedAt = new Date().toISOString();

  const analyticsAndId: SessionAnalytics = {
    sessionId,
    totalViewers,
    peakViewers,
    totalMessages,
    avgWatchTime,
    uniqueChatters,
    computedAt
  };

  try {
    // Save to Firestore
    await setDoc(sessionAnalyticsDoc(sessionId), {
       ...analyticsAndId,
       computedAt: serverTimestamp() // Overwrite with server time
    });
  } catch (error) {
    console.error("Error saving computed analytics:", error);
    throw error;
  }

  return analyticsAndId;
}
