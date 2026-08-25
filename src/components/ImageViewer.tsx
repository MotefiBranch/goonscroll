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
  const [failedMain, setFailedMain] = useState(false);
  const [error, setError] = useState(false);

  const mediaSrc = getProxiedMediaUrl(url);
  const thumbSrc = previewUrl ? getProxiedMediaUrl(previewUrl) : mediaSrc;

  // Use thumbSrc as fallback if mediaSrc fails
  const currentSrc = failedMain ? thumbSrc : mediaSrc;

  const handleImageError = () => {
    if (!failedMain && thumbSrc && thumbSrc !== mediaSrc) {
      setFailedMain(true);
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
          className={`absolute inset-0 w-full h-full ${
            fitMode === 'cover' ? 'object-cover' : 'object-contain'
          } blur-md opacity-40 transition-opacity`}
        />
      )}

      {/* Main Image with fallback */}
      <img
        src={currentSrc}
        alt={altText}
        loading="eager"
        decoding="async"
        onLoad={() => setLoaded(true)}
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
