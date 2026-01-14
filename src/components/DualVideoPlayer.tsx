import { useState, useRef, useEffect } from 'react';
import type {  MediaPlayerElement } from 'vidstack';
import VideoPlayer from './VideoPlayer';
import useServerTimeSync from '@/hooks/useServerTimeSync';

interface DualVideoPlayerProps {
  screenUrl: string;
  faceUrl: string;
  sessionId: string;
  scheduledStart: Date;
}

type PipPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

const positionClasses: Record<PipPosition, string> = {
  'top-left': 'top-4 left-4',
  'top-right': 'top-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'bottom-right': 'bottom-4 right-4',
};

const positionCycle: PipPosition[] = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];

const DRIFT_THRESHOLD = 0.25; // seconds
const DRIFT_CHECK_INTERVAL = 5000; // 5 seconds

export default function DualVideoPlayer({ screenUrl, faceUrl, sessionId, scheduledStart }: DualVideoPlayerProps) {
  const [pipPosition, setPipPosition] = useState<PipPosition>('bottom-right');
  const [screenTime, setScreenTime] = useState(0);
  const [faceTime, setFaceTime] = useState(0);

  // Refs for video players
  const screenPlayerRef = useRef<MediaPlayerElement>(null);
  const facePlayerRef = useRef<MediaPlayerElement>(null);

  // Get live offset from server time sync
  const { liveOffset, serverTime } = useServerTimeSync({
    sessionId,
    scheduledStart,
  });

  // Seek both videos when liveOffset changes
  useEffect(() => {
    if (liveOffset > 0 && screenPlayerRef.current && facePlayerRef.current) {
      console.log(`[DualVideoPlayer] Seeking to liveOffset: ${liveOffset.toFixed(2)}s`);
      (screenPlayerRef.current as any).currentTime = liveOffset;
      (facePlayerRef.current as any).currentTime = liveOffset;
    }
  }, [liveOffset]);

  // Drift correction logic - check every 5 seconds
  useEffect(() => {
    const driftCheckInterval = setInterval(() => {
      if (!screenPlayerRef.current || !facePlayerRef.current || !serverTime) {
        return;
      }

      // Calculate expected time based on current server time
      const now = new Date();
      const elapsedMs = now.getTime() - scheduledStart.getTime();
      const expectedTime = elapsedMs / 1000;

      // Check drift for screen player
      const screenDrift = Math.abs(screenTime - expectedTime);
      if (screenDrift > DRIFT_THRESHOLD) {
        console.log(`[Drift Correction] Screen video drifted by ${screenDrift.toFixed(2)}s, correcting to ${expectedTime.toFixed(2)}s`);
        (screenPlayerRef.current as any).currentTime = expectedTime;
      }

      // Check drift for face player
      const faceDrift = Math.abs(faceTime - expectedTime);
      if (faceDrift > DRIFT_THRESHOLD) {
        console.log(`[Drift Correction] Face video drifted by ${faceDrift.toFixed(2)}s, correcting to ${expectedTime.toFixed(2)}s`);
        (facePlayerRef.current as any).currentTime = expectedTime;
      }
    }, DRIFT_CHECK_INTERVAL);

    return () => {
      clearInterval(driftCheckInterval);
    };
  }, [screenTime, faceTime, serverTime, scheduledStart]);

  const handlePipClick = () => {
    const currentIndex = positionCycle.indexOf(pipPosition);
    const nextIndex = (currentIndex + 1) % positionCycle.length;
    setPipPosition(positionCycle[nextIndex]);
  };

  return (
    <div className="relative w-full h-screen">
      {/* Main video (screen share) */}
      <VideoPlayer
        ref={screenPlayerRef}
        videoUrl={screenUrl}
        onTimeUpdate={setScreenTime}
      />

      {/* PiP video (face cam) */}
      <div
        className={`absolute ${positionClasses[pipPosition]} w-64 h-48 cursor-pointer rounded-lg overflow-hidden shadow-lg`}
        onClick={handlePipClick}
      >
        <VideoPlayer
          ref={facePlayerRef}
          videoUrl={faceUrl}
          onTimeUpdate={setFaceTime}
        />
      </div>
    </div>
  );
}
