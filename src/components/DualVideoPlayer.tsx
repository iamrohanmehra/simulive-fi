import { useEffect, useRef } from 'react';
import { MediaPlayer, MediaOutlet } from '@vidstack/react';
import type { MediaPlayerElement } from 'vidstack';
import 'vidstack/styles/base.css';
import { useServerTimeSync } from '@/hooks/useServerTimeSync';
import type { Session } from '@/lib/types';
import LoadingSpinner from '@/components/LoadingSpinner';
import { startTrace, endTrace, recordMetric } from '@/lib/performance';

// FIXED #47 & Magic Numbers: Define constants
const DRIFT_THRESHOLD_SECONDS = 0.25;
const SYNC_INTERVAL_MS = 5000; // Changed from 500ms to 5000ms per project rules

interface DualVideoPlayerProps {
  session: Session;
}

const DualVideoPlayer = ({ session }: DualVideoPlayerProps) => {
  const mainPlayerRef = useRef<MediaPlayerElement>(null);
  const facePlayerRef = useRef<MediaPlayerElement>(null);
  
  // Performance: Trace video start
  useEffect(() => {
    const t = startTrace('video_playback_start');
    
    // We'll stop this trace when the video actually plays
    const handlePlay = () => endTrace(t);
    
    const player = mainPlayerRef.current;
    if (player) {
      (player as HTMLElement).addEventListener('play', handlePlay, { once: true });
    }
    
    return () => {
        endTrace(t);
        (player as HTMLElement)?.removeEventListener('play', handlePlay);
    };
  }, []);
  
  // Get the calculated live offset from server time
  const { liveOffset, isSynced } = useServerTimeSync(session.id, session.scheduledStart);

  // Sync logic
  useEffect(() => {
    if (!isSynced) return;

    const syncPlayer = (player: MediaPlayerElement | null, playerName: string) => {
      if (!player) return;

      const playerInstance = player as unknown as { currentTime: number; paused: boolean; play: () => Promise<void> };
      const currentTime = playerInstance.currentTime;
      const drift = Math.abs(currentTime - liveOffset);

      // If drift is significant (> threshold), seek to live offset
      if (drift > DRIFT_THRESHOLD_SECONDS) {
        playerInstance.currentTime = liveOffset;
        recordMetric(null, 'drift_correction_event', 1);
      }
      
      // Ensure player is playing
      if (playerInstance.paused) {
        playerInstance.play().catch((err) => {
          // FIXED #17: Log blocked autoplay for debugging instead of silent swallow
          console.debug(`[${playerName}] Autoplay blocked:`, err.message);
        });
      }
    };

    // FIXED #47: Check drift every 5 seconds (was 500ms)
    const interval = setInterval(() => {
      syncPlayer(mainPlayerRef.current, 'main');
      syncPlayer(facePlayerRef.current, 'face');
    }, SYNC_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [liveOffset, isSynced]);

  // Initial sync when offset loads
  useEffect(() => {
    if (isSynced && liveOffset > 0) {
      if (mainPlayerRef.current) (mainPlayerRef.current as any).currentTime = liveOffset;
      if (facePlayerRef.current) (facePlayerRef.current as any).currentTime = liveOffset;
    }
  }, [isSynced, liveOffset]);

  // Resource cleanup on unmount
  useEffect(() => {
    return () => {
      const cleanupPlayer = (player: MediaPlayerElement | null) => {
        if (player) {
          try {
            const playerInstance = player as any;
            if (typeof playerInstance.pause === 'function') playerInstance.pause();
            
            // Explicitly clearing src to release memory
            if (typeof playerInstance.setAttribute === 'function') {
                playerInstance.setAttribute('src', '');
            }
            
            if (typeof playerInstance.load === 'function') playerInstance.load();
          } catch (e) {
            // Ignore errors during cleanup
            console.warn('Player cleanup error', e);
          }
        }
      };

      cleanupPlayer(mainPlayerRef.current);
      cleanupPlayer(facePlayerRef.current);
    };
  }, []);
  if (!isSynced) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black">
        <LoadingSpinner size="lg" text="Loading live stream..." className="text-white" />
      </div>
    );
  }


  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
      {/* Main Screen Share Player */}
      <MediaPlayer
        ref={mainPlayerRef}
        src={session.screenUrl}
        streamType="live"
        controls={false}
        autoPlay
        playsInline
        className="w-full h-full object-contain"
        onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
      >
        <MediaOutlet />
      </MediaPlayer>

      {/* Face Cam PiP Player */}
      {session.faceUrl && (
        <div className="absolute bottom-4 right-4 w-48 h-36 md:w-64 md:h-48 rounded-lg overflow-hidden shadow-lg border-2 border-gray-800 z-10 transition-all hover:scale-105">
          <MediaPlayer
            ref={facePlayerRef}
            src={session.faceUrl}
            streamType="live"
            controls={false}
            autoPlay
            playsInline
            muted // Mute face cam to avoid echo, assuming main audio is sufficient or same source
            className="w-full h-full object-cover"
            onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
          >
            <MediaOutlet />
          </MediaPlayer>
        </div>
      )}
    </div>
  );
};

export default DualVideoPlayer;
