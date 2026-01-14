import { useEffect, useRef } from 'react';
import { MediaPlayer, MediaOutlet } from '@vidstack/react';
import type { MediaPlayerElement } from 'vidstack';
import '@vidstack/react/player/styles/base.css';
import { useServerTimeSync } from '@/hooks/useServerTimeSync';
import type { Session } from '@/lib/types';

interface DualVideoPlayerProps {
  session: Session;
}

const DualVideoPlayer = ({ session }: DualVideoPlayerProps) => {
  const mainPlayerRef = useRef<MediaPlayerElement>(null);
  const facePlayerRef = useRef<MediaPlayerElement>(null);
  
  // Get the calculated live offset from server time
  const { liveOffset, isSynced } = useServerTimeSync(session.id, session.scheduledStart);

  // Sync logic
  useEffect(() => {
    if (!isSynced) return;

    const syncPlayer = (player: MediaPlayerElement | null) => {
      if (!player) return;

      const playerInstance = player as any;
      const currentTime = playerInstance.currentTime;
      const drift = Math.abs(currentTime - liveOffset);

      // If drift is significant (> 0.25s), seek to live offset
      if (drift > 0.25) {
        playerInstance.currentTime = liveOffset;
      }
      
      // Ensure player is playing
      if (playerInstance.paused) {
        playerInstance.play().catch(() => {
          // Auto-play might fail without interaction, handle silently
        });
      }
    };

    // Check drift every 500ms
    const interval = setInterval(() => {
      syncPlayer(mainPlayerRef.current);
      syncPlayer(facePlayerRef.current);
    }, 500);

    return () => clearInterval(interval);
  }, [liveOffset, isSynced]);

  // Initial sync when offset loads
  useEffect(() => {
    if (isSynced && liveOffset > 0) {
      if (mainPlayerRef.current) (mainPlayerRef.current as any).currentTime = liveOffset;
      if (facePlayerRef.current) (facePlayerRef.current as any).currentTime = liveOffset;
    }
  }, [isSynced, liveOffset]);

  if (!isSynced) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        Loading live stream...
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
