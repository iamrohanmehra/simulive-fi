import { forwardRef } from 'react';
import { MediaPlayer, MediaOutlet } from '@vidstack/react';
import type { MediaPlayerElement } from 'vidstack';
import '@vidstack/react/player/styles/default/theme.css';
import '@vidstack/react/player/styles/default/layouts/video.css';

interface VideoPlayerProps {
  videoUrl: string;
  onTimeUpdate?: (time: number) => void;
}

const VideoPlayer = forwardRef<MediaPlayerElement, VideoPlayerProps>(
  ({ videoUrl, onTimeUpdate }, ref) => {
    return (
      <MediaPlayer
        ref={ref}
        streamType="live"
        src={videoUrl}
        playsInline
        autoPlay
        controls={false}
        onTimeUpdate={(detail: any) => {
          if (onTimeUpdate) {
            onTimeUpdate(detail.currentTime);
          }
        }}
      >
        <MediaOutlet />
      </MediaPlayer>
    );
  }
);

VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;
