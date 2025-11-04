'use client';

import { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  youtubeId: string;
  autoplay?: boolean;
  className?: string;
  title?: string;
}

const VideoPlayer = ({
  youtubeId,
  autoplay = true,
  className,
  title = 'YouTube 비디오',
}: VideoPlayerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // iframe이 로드되면 자동 재생
    if (iframeRef.current && autoplay) {
      const iframe = iframeRef.current;
      const observer = new MutationObserver(() => {
        if (iframe.contentWindow) {
          // YouTube iframe API를 통해 자동 재생 가능
        }
      });
      observer.observe(iframe, { attributes: true });
      return () => observer.disconnect();
    }
  }, [autoplay]);

  return (
    <div className={className} role="region" aria-label="비디오 플레이어">
      <iframe
        ref={iframeRef}
        width="100%"
        height="100%"
        src={`https://www.youtube.com/embed/${youtubeId}?autoplay=${
          autoplay ? 1 : 0
        }&rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="aspect-video w-full rounded-lg"
        aria-label={`${title} YouTube 비디오 플레이어`}
      />
    </div>
  );
};

export default VideoPlayer;
