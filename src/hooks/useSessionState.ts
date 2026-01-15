import { useState, useEffect } from 'react';
import { onSnapshot } from 'firebase/firestore';
import { sessionDoc } from '@/lib/firestore-collections';
import type { Session } from '@/lib/types';

type SessionState = 'scheduled' | 'live' | 'ended';

interface UseSessionStateReturn {
  sessionState: SessionState;
  session: Session | null;
  loading: boolean;
  error: Error | null; // FIXED #11: Added error state
}

/**
 * Hook to manage session state with real-time updates from Firestore.
 * Determines session state based on isLive flag and scheduledStart time.
 * 
 * @param sessionId - The ID of the session to track
 * @returns Object containing sessionState, session data, loading status, and error
 */
const useSessionState = (sessionId: string): UseSessionStateReturn => {
  const [sessionState, setSessionState] = useState<SessionState>('scheduled');
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null); // FIXED #11: Added error state

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    // Reset error on new session
    setError(null);

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
        setError(null);
      },
      (err) => {
        // FIXED #11: Set error state for UI to handle
        console.error('Error fetching session:', err);
        setError(err);
        setLoading(false);
      }
    );

    // Cleanup listener on unmount
    return () => {
      unsubscribe();
    };
  }, [sessionId]);

  return { sessionState, session, loading, error };
};

export default useSessionState;

