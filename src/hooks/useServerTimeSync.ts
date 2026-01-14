import { useState, useEffect, useRef } from 'react';
import { getServerTime } from '@/lib/server-time';
import { Timestamp } from 'firebase/firestore';

/**
 * Hook to sync with server time and calculate the live playback offset.
 * 
 * @param sessionId - Current session ID (used to reset sync on change)
 * @param scheduledStart - The scheduled start time of the session (Firestore Timestamp) or Date string
 * @returns Object containing the calculations:
 *   - liveOffset: Number of seconds since the session started (for video seeking)
 *   - isSynced: Boolean indicating if the initial sync has completed
 */
export function useServerTimeSync(
  sessionId: string,
  scheduledStart: string | Timestamp | Date
) {
  const [liveOffset, setLiveOffset] = useState(0);
  const [isSynced, setIsSynced] = useState(false);
  
  // Use a ref to track if we're mounted to avoid state updates after unmount
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    async function sync() {
      try {
        const serverTime = await getServerTime();
        
        if (!isMounted.current) return;

        // Convert scheduledStart to Date object
        let startDate: Date;
        if (typeof scheduledStart === 'string') {
          startDate = new Date(scheduledStart);
        } else if (scheduledStart instanceof Timestamp) {
          startDate = scheduledStart.toDate();
        } else {
          startDate = scheduledStart;
        }

        // Calculate offset in seconds
        const offsetInSeconds = (serverTime.getTime() - startDate.getTime()) / 1000;
        
        // Ensure offset is never negative (session hasn't started yet)
        setLiveOffset(Math.max(0, offsetInSeconds));
        setIsSynced(true);
        
      } catch (error) {
        console.error('Failed to sync server time:', error);
      }
    }

    // Initial sync
    sync();

    // Re-sync every 30 seconds to correct for drift
    const interval = setInterval(sync, 30000);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [sessionId, scheduledStart]);

  return { liveOffset, isSynced };
}

export default useServerTimeSync;
