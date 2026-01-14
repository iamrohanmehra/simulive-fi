import { useState, useEffect } from 'react';
import { getServerTime } from '@/lib/server-time';

interface UseServerTimeSyncParams {
  sessionId: string;
  scheduledStart: Date;
}

interface UseServerTimeSyncResult {
  liveOffset: number;
  serverTime: Date | null;
  isDriftCorrecting: boolean;
}

export default function useServerTimeSync({ sessionId, scheduledStart }: UseServerTimeSyncParams): UseServerTimeSyncResult {
  const [serverTime, setServerTime] = useState<Date | null>(null);
  const [liveOffset, setLiveOffset] = useState(0);
  const [isDriftCorrecting, setIsDriftCorrecting] = useState(false);

  const updateTimeSync = async () => {
    try {
      const currentServerTime = await getServerTime();
      setServerTime(currentServerTime);

      // Calculate offset in seconds from scheduled start
      const offsetMs = currentServerTime.getTime() - scheduledStart.getTime();
      const offsetSeconds = offsetMs / 1000;
      setLiveOffset(offsetSeconds);
    } catch (error) {
      console.error('Failed to sync server time:', error);
    }
  };

  useEffect(() => {
    // Initial sync on mount
    updateTimeSync();

    // Set up interval for periodic sync (every 30 seconds)
    const intervalId = setInterval(async () => {
      setIsDriftCorrecting(true);
      await updateTimeSync();
      setIsDriftCorrecting(false);
    }, 30000);

    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [sessionId, scheduledStart]);

  return {
    liveOffset,
    serverTime,
    isDriftCorrecting,
  };
}
