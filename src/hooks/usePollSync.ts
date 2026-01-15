import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { logError } from '@/lib/error-logger';
import type { Poll, PollOption } from '@/lib/types';

/**
 * FIXED #2: Extracted shared poll sync hook from SessionPage and ActivePollsPanel
 * 
 * Provides real-time poll synchronization with:
 * - Active poll subscription
 * - Grace period for displaying ended polls
 * - Error handling
 */

// Re-export types for convenience
export type { Poll, PollOption };

interface UsePollSyncOptions {
  /** Grace period in ms before hiding ended polls (default: 10000) */
  gracePeriodMs?: number;
  /** Only fetch active polls (default: true) */
  activeOnly?: boolean;
}

interface UsePollSyncReturn {
  /** Currently active poll (or last active if within grace period) */
  activePoll: Poll | null;
  /** All polls matching the query */
  polls: Poll[];
  /** Loading state */
  loading: boolean;
  /** Error if any */
  error: Error | null;
}

export function usePollSync(
  sessionId: string,
  options: UsePollSyncOptions = {}
): UsePollSyncReturn {
  const { gracePeriodMs = 10000, activeOnly = true } = options;
  
  const [polls, setPolls] = useState<Poll[]>([]);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [displayedPoll, setDisplayedPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Subscribe to polls
  useEffect(() => {
    if (!sessionId) return;

    setError(null);

    const constraints = [
      where('sessionId', '==', sessionId),
      orderBy('createdAt', 'desc')
    ];

    if (activeOnly) {
      constraints.splice(1, 0, where('isActive', '==', true));
    }

    const q = query(collection(db, 'polls'), ...constraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedPolls = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Poll[];

        setPolls(fetchedPolls);
        
        // Set the first active poll as the current active poll
        const active = fetchedPolls.find(p => p.isActive) || null;
        setActivePoll(active);
        
        setLoading(false);
      },
      (err) => {
        logError(err, { action: 'poll_sync', sessionId });
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [sessionId, activeOnly]);

  // Grace period handling
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (activePoll) {
      setDisplayedPoll(activePoll);
    } else if (displayedPoll) {
      // Poll ended, wait grace period before clearing
      timeout = setTimeout(() => {
        setDisplayedPoll(null);
      }, gracePeriodMs);
    }

    return () => clearTimeout(timeout);
  }, [activePoll, displayedPoll, gracePeriodMs]);

  return {
    activePoll: displayedPoll,
    polls,
    loading,
    error,
  };
}

export default usePollSync;
