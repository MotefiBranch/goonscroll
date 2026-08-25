import React from 'react';
import { useFeedStore } from '../store/useFeedStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { MediaItem } from './MediaItem';
import { useGestures } from '../hooks/useGestures';

interface FeedCarouselProps {
  isModalOpen?: boolean;
}

export const FeedCarousel: React.FC<FeedCarouselProps> = ({ isModalOpen = false }) => {
  const {
    items,
    currentIndex,
    isLoading,
    hasMore,
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
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#101828] text-white">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-zinc-400 text-sm animate-pulse">Loading feed...</p>
      </div>
    );
  }

  if (items.length === 0 && !isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#101828] text-white p-6 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h2 className="text-xl font-bold mb-2">No Posts Found</h2>
        <p className="text-zinc-400 text-sm max-w-md">
          No media matched your search or active blacklist filter. Try adjusting your tags or checking the blacklist in settings.
        </p>
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
