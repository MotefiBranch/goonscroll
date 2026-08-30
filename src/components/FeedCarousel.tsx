import React from 'react';
import { useFeedStore } from '../store/useFeedStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { MediaItem } from './MediaItem';
import { useGestures } from '../hooks/useGestures';

const ALL_SOURCES = [
  { id: 'rule34', name: 'Rule34', icon: '🎨' },
  { id: 'e621', name: 'e621', icon: '🐾' },
  { id: 'danbooru', name: 'Danbooru', icon: '🌸' },
  { id: 'yande', name: 'Yande.re', icon: '👘' },
  { id: 'konachan', name: 'Konachan', icon: '🐱' },
  { id: 'rule34paheal', name: 'Rule34 Paheal', icon: '⚡' },
  { id: 'xbooru', name: 'Xbooru', icon: '🔞' },
  { id: 'reddit', name: 'Reddit', icon: '👽' },
];

interface FeedCarouselProps {
  isModalOpen?: boolean;
}

export const FeedCarousel: React.FC<FeedCarouselProps> = ({ isModalOpen = false }) => {
  const {
    source,
    searchTags,
    items,
    currentIndex,
    isLoading,
    hasMore,
    lastError,
    setSource,
    retry,
    nextItem,
    prevItem,
  } = useFeedStore();

  const { isMuted, volume, fitMode } = useSettingsStore();

  // Bind vertical gesture swipes, wheel, and keyboard
  useGestures({
    onSwipeUp: nextItem,
    onSwipeDown: prevItem,
    disabled: isModalOpen || items.length === 0,
  });

  if (items.length === 0 && isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#101828] text-white p-6">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-300 text-base font-semibold animate-pulse">Loading {source} feed...</p>
        <p className="text-zinc-500 text-xs mt-1">Connecting to Booru API</p>
      </div>
    );
  }

  if (items.length === 0 && !isLoading) {
    const currentSourceObj = ALL_SOURCES.find(s => s.id === source);

    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#101828] text-white p-6 text-center overflow-y-auto">
        <div className="text-5xl mb-3">{currentSourceObj?.icon || '🔍'}</div>
        <h2 className="text-xl font-bold mb-1">No Posts Loaded ({currentSourceObj?.name || source})</h2>
        
        {searchTags ? (
          <p className="text-zinc-400 text-xs mb-3">
            Search tags: <span className="text-blue-400 font-mono">"{searchTags}"</span>
          </p>
        ) : null}

        {lastError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 max-w-sm mb-4 text-left w-full">
            <div className="text-xs font-semibold text-red-400 flex items-center gap-1.5 mb-1">
              <span>⚠️</span> <span>Diagnostic Info:</span>
            </div>
            <p className="text-[11px] text-zinc-300 font-mono break-all">{lastError}</p>
          </div>
        )}

        <div className="flex flex-col gap-2 w-full max-w-xs mb-6">
          <button
            onClick={() => retry()}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-medium rounded-xl text-sm transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
          >
            <span>🔄</span> <span>Retry {currentSourceObj?.name || 'Feed'}</span>
          </button>
        </div>

        <div className="w-full max-w-xs pt-4 border-t border-white/10">
          <p className="text-xs text-zinc-400 mb-2 font-medium">Try another source:</p>
          <div className="grid grid-cols-2 gap-2">
            {ALL_SOURCES.filter(s => s.id !== source).slice(0, 4).map(s => (
              <button
                key={s.id}
                onClick={() => setSource(s.id)}
                className="py-2 px-3 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 rounded-lg text-xs font-medium text-zinc-300 transition flex items-center justify-center gap-1.5"
              >
                <span>{s.icon}</span> <span>{s.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-black select-none">
      {/* Vertical sliding container */}
      <div
        className="w-full h-full transition-transform duration-300 ease-out flex flex-col"
        style={{
          transform: `translateY(-${currentIndex * 100}%)`,
        }}
      >
        {items.map((item, index) => {
          // Virtual rendering: only render active item and ±2 neighbors to save memory on mobile
          const isNearby = Math.abs(index - currentIndex) <= 2;
          const isActive = index === currentIndex;

          return (
            <div
              key={item.id}
              className="w-full h-full flex-shrink-0 relative overflow-hidden"
              style={{ minHeight: '100%' }}
            >
              {isNearby ? (
                <MediaItem
                  item={item}
                  isActive={isActive}
                  isMuted={isMuted}
                  volume={volume}
                  fitMode={fitMode}
                />
              ) : (
                <div className="w-full h-full bg-zinc-950 flex items-center justify-center text-zinc-700 text-xs">
                  Offscreen
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Loading indicator for pagination */}
      {isLoading && items.length > 0 && (
        <div className="absolute bottom-4 right-4 z-40 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center space-x-2 text-xs text-zinc-300">
          <div className="w-3 h-3 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
          <span>Loading more...</span>
        </div>
      )}
    </div>
  );
};
