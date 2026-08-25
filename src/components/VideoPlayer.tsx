import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';
import { getProxiedMediaUrl } from '../api/client';

interface VideoPlayerProps {
  url: string;
  previewUrl?: string;
  fitMode: 'contain' | 'cover';
  isActive: boolean;
  isMuted: boolean;
  volume: number;
  onErrorFallback?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  url,
  previewUrl,
  fitMode,
  isActive,
  isMuted,
  volume,
  onErrorFallback,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayIcon, setShowPlayIcon] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isBuffering, setIsBuffering] = useState(true);

  const proxiedSrc = getProxiedMediaUrl(url);

  // Sync active state with playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isActive) {
      video.currentTime = 0;
      video.muted = isMuted;
      video.volume = isMuted ? 0 : volume;

      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            setIsBuffering(false);
          })
          .catch(err => {
            console.warn('Autoplay restricted, retrying muted:', err.message);
            video.muted = true;
            video.play()
              .then(() => {
                setIsPlaying(true);
                setIsBuffering(false);
              })
              .catch(e => {
                console.warn('Playback failed:', e.message);
                setIsPlaying(false);
              });
          });
      }
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [isActive, isMuted, volume, proxiedSrc]);

  const togglePlayPause = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true));
    } else {
      video.pause();
      setIsPlaying(false);
    }

    setShowPlayIcon(true);
    setTimeout(() => setShowPlayIcon(false), 700);
  }, []);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setProgress((video.currentTime / video.duration) * 100);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video || !video.duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
    video.currentTime = newProgress * video.duration;
    setProgress(newProgress * 100);
  };

  const handleVideoError = () => {
    console.warn('Video element error for URL, calling fallback:', url);
    onErrorFallback?.();
  };

  return (
    <div
      className="relative w-full h-full flex items-center justify-center bg-black select-none overflow-hidden cursor-pointer"
      onClick={togglePlayPause}
    >
      <video
        ref={videoRef}
        src={proxiedSrc}
        poster={previewUrl ? getProxiedMediaUrl(previewUrl) : undefined}
        loop
        autoPlay
        playsInline
        webkit-playsinline="true"
        preload={isActive ? 'auto' : 'metadata'}
        onTimeUpdate={handleTimeUpdate}
        onError={handleVideoError}
        onWaiting={() => setIsBuffering(true)}
        onCanPlay={() => setIsBuffering(false)}
        onPlaying={() => {
          setIsBuffering(false);
          setIsPlaying(true);
        }}
        onPause={() => setIsPlaying(false)}
        className={`w-full h-full ${
          fitMode === 'cover' ? 'object-cover' : 'object-contain'
        }`}
      />

      {/* Play/Pause Pulse Animation Overlay */}
      {showPlayIcon && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="p-5 rounded-full bg-black/60 backdrop-blur-md text-white scale-110 animate-ping duration-300">
            {isPlaying ? <Play size={40} /> : <Pause size={40} />}
          </div>
        </div>
      )}

      {/* Buffering Spinner */}
      {isBuffering && isActive && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Bottom Video Progress Scrub Bar */}
      <div
        className="absolute bottom-0 left-0 right-0 h-2 bg-white/10 hover:h-3 transition-all cursor-pointer z-30 group"
        onClick={handleSeek}
      >
        <div
          className="h-full bg-blue-500 transition-all duration-75 relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </div>
      </div>
    </div>
  );
};
