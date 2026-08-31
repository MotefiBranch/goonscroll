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
  const [retryNonce, setRetryNonce] = useState(0);

  // Reset state when post URL changes
  React.useEffect(() => {
    setLoaded(false);
    setSrcIndex(0);
    setError(false);
    setRetryNonce(0);
  }, [url]);

  // Multi-tier fallback pipeline (.gif -> .jpeg -> .jpg -> .png -> high-res sample -> thumb):
  const candidateUrls: string[] = [];
  if (url) {
    if (url.includes('rule34.xxx')) {
      const clean = url.split('?')[0];
      const query = url.includes('?') ? '?' + url.split('?')[1] : '';
      const base = clean
        .replace(/\/thumbnails\/+/g, '/images/')
        .replace(/\/images\/+/g, '/images/')
        .replace('thumbnail_', '')
        .replace(/\.[a-z0-9]+$/i, '');
      const sample = clean
        .replace(/\/thumbnails\/+/g, '/samples/')
        .replace(/\/images\/+/g, '/samples/')
        .replace('thumbnail_', 'sample_')
        .replace(/\/([^/]+)$/, (m) => m.startsWith('/sample_') ? m : '/sample_' + m.slice(1))
        .replace(/\.[a-z0-9]+$/i, '.jpg') + query;

      if (clean.endsWith('.gif')) {
        candidateUrls.push(base + '.gif' + query);
        candidateUrls.push(base + '.jpeg' + query);
        candidateUrls.push(base + '.jpg' + query);
        candidateUrls.push(base + '.png' + query);
      } else {
        candidateUrls.push(base + '.jpeg' + query);
        candidateUrls.push(base + '.jpg' + query);
        candidateUrls.push(base + '.png' + query);
        candidateUrls.push(base + '.gif' + query);
      }
      candidateUrls.push(sample);
    } else {
      candidateUrls.push(url);
    }
  }
  if (previewUrl && !candidateUrls.includes(previewUrl)) {
    candidateUrls.push(previewUrl);
  }

  const candidates = candidateUrls.map(u => getProxiedMediaUrl(u, retryNonce)).filter(Boolean);
  const currentSrc = candidates[srcIndex] || getProxiedMediaUrl(url, retryNonce);
  const thumbSrc = previewUrl ? getProxiedMediaUrl(previewUrl, retryNonce) : currentSrc;

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
        key={`${currentSrc}-${retryNonce}`}
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
        <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 bg-zinc-900/90 p-4 text-center z-20 space-y-2">
          <span className="text-3xl">⚠️</span>
          <p className="text-sm font-medium text-zinc-300">Unable to load image</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLoaded(false);
              setError(false);
              setSrcIndex(0);
              setRetryNonce(Date.now());
            }}
            className="mt-1 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-full active:scale-95 transition-all shadow pointer-events-auto"
          >
            🔄 Tap to Retry
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-[11px] text-zinc-400 hover:text-blue-400 underline pt-1 pointer-events-auto"
          >
            Open original post URL
          </a>
        </div>
      )}
    </div>
  );
};
