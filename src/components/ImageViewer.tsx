import React, { useState } from 'react';
import { getProxiedMediaUrl } from '../api/client';

interface ImageViewerProps {
  url: string;
  previewUrl?: string;
  altText?: string;
  fitMode: 'contain' | 'cover';
  isActive: boolean;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  url,
  previewUrl,
  altText = 'Media content',
  fitMode,
}) => {
  const [loaded, setLoaded] = useState(false);
  const [srcIndex, setSrcIndex] = useState(0);
  const [error, setError] = useState(false);

  // Reset state when post URL changes
  React.useEffect(() => {
    setLoaded(false);
    setSrcIndex(0);
    setError(false);
  }, [url]);

  // Multi-tier fallback pipeline:
  // 1. Proxied full media
  // 2. Proxied thumbnail / sample
  // 3. Direct unproxied full media (bypasses server proxy if blocked by CDN)
  // 4. Direct unproxied preview
  const candidates = [
    getProxiedMediaUrl(url),
    previewUrl ? getProxiedMediaUrl(previewUrl) : null,
    url,
    previewUrl || null,
  ].filter(Boolean) as string[];

  const currentSrc = candidates[srcIndex] || url;
  const thumbSrc = previewUrl ? getProxiedMediaUrl(previewUrl) : currentSrc;

  const handleImageError = () => {
    if (srcIndex < candidates.length - 1) {
      setSrcIndex(prev => prev + 1);
    } else {
      setError(true);
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black select-none overflow-hidden">
      {/* Low-res / preview blur background while loading */}
      {!loaded && thumbSrc && (
        <img
          src={thumbSrc}
          alt=""
          referrerPolicy="no-referrer"
          className={`absolute inset-0 w-full h-full ${
            fitMode === 'cover' ? 'object-cover' : 'object-contain'
          } blur-md opacity-40 transition-opacity`}
        />
      )}

      {/* Main Image with multi-tier fallback */}
      <img
        src={currentSrc}
        alt={altText}
        loading="eager"
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => {
          setLoaded(true);
          setError(false);
        }}
        onError={handleImageError}
        className={`w-full h-full ${
          fitMode === 'cover' ? 'object-cover' : 'object-contain'
        } transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        draggable={false}
      />

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 bg-zinc-900/80 p-4 text-center z-20">
          <span className="text-2xl mb-2">⚠️</span>
          <p className="text-sm">Unable to load image.</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 text-xs text-blue-400 underline"
          >
            Open original URL
          </a>
        </div>
      )}
    </div>
  );
};
