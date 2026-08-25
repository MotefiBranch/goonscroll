import React, { useState, useEffect } from 'react';
import { FeedItem } from '../types/feed';
import { VideoPlayer } from './VideoPlayer';
import { ImageViewer } from './ImageViewer';

interface MediaItemProps {
  item: FeedItem;
  isActive: boolean;
  isMuted: boolean;
  volume: number;
  fitMode: 'contain' | 'cover';
}

export const MediaItem: React.FC<MediaItemProps> = ({
  item,
  isActive,
  isMuted,
  volume,
  fitMode,
}) => {
  const [videoFailed, setVideoFailed] = useState(false);

  // Reset state if item changes
  useEffect(() => {
    setVideoFailed(false);
  }, [item.id]);

  const isVideo = item.type === 'video' && !videoFailed;

  if (isVideo) {
    return (
      <VideoPlayer
        url={item.mediaUrl}
        previewUrl={item.previewUrl}
        fitMode={fitMode}
        isActive={isActive}
        isMuted={isMuted}
        volume={volume}
        onErrorFallback={() => setVideoFailed(true)}
      />
    );
  }

  return (
    <ImageViewer
      url={item.mediaUrl}
      previewUrl={item.previewUrl}
      altText={item.tags?.all?.slice(0, 5).join(', ')}
      fitMode={fitMode}
      isActive={isActive}
    />
  );
};
