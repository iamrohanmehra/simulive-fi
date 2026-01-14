import { useState, useEffect } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { sessionDoc } from '@/lib/firestore-collections';
import type { Session } from '@/lib/types';

type SessionState = 'scheduled' | 'live' | 'ended';

interface UseSessionStateReturn {
  sessionState: SessionState;
  session: Session | null;
  loading: boolean;
}

/**
 * Hook to manage session state with real-time updates from Firestore.
 * Determines session state based on isLive flag and scheduledStart time.
 * 
 * @param sessionId - The ID of the session to track
 * @returns Object containing sessionState, session data, and loading status
 */
const useSessionState = (sessionId: string): UseSessionStateReturn => {
  const [sessionState, setSessionState] = useState<SessionState>('scheduled');
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    // Get reference to the session document
    const sessionRef = sessionDoc(sessionId);

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      sessionRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const sessionData = snapshot.data() as Session;
          setSession(sessionData);

          // Determine session state
          const now = new Date();
          const scheduledStart = new Date(sessionData.scheduledStart);

          let newState: SessionState;
          if (sessionData.isLive) {
            newState = 'live';
          } else if (scheduledStart > now) {
            newState = 'scheduled';
          } else {
            newState = 'ended';
          }

          setSessionState(newState);
        } else {
          // Session document doesn't exist
          setSession(null);
          setSessionState('ended');
        }

        setLoading(false);
      },
      (error) => {
        console.error('Error fetching session:', error);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => {
      unsubscribe();
    };
  }, [sessionId]);

  return { sessionState, session, loading };
};

export default useSessionState;
