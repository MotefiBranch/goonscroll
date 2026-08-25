import React, { useState } from 'react';
import {
  Heart,
  Tag,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Download,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { FeedItem } from '../types/feed';
import { useSettingsStore } from '../store/useSettingsStore';
import { useFavoritesStore } from '../store/useFavoritesStore';
import { useToastStore } from '../store/useToastStore';

interface ActionBarProps {
  item: FeedItem;
  onOpenTagDrawer: () => void;
}

export const ActionBar: React.FC<ActionBarProps> = ({ item, onOpenTagDrawer }) => {
  const { isMuted, volume, toggleMute, setVolume, fitMode, toggleFitMode } = useSettingsStore();
  const toggleFavorite = useFavoritesStore(state => state.toggleFavorite);
  const favorited = useFavoritesStore(state => state.favoriteIds.has(item.id));
  const { showToast } = useToastStore();
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const tagCount = item.tags?.all?.length || 0;

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const result = await toggleFavorite(item);
    showToast({
      text: result ? 'Added to Saved Favorites' : 'Removed from Favorites',
      duration: 3000,
    });
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      showToast({ text: 'Starting download...', duration: 2000 });
      const a = document.createElement('a');
      a.href = item.mediaUrl;
      a.download = `goonscroll_${item.id}.${item.type === 'video' ? 'mp4' : 'jpg'}`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      showToast({ text: 'Download failed to start', duration: 3000 });
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.sourceName,
          url: item.sourceUrl || item.mediaUrl,
        });
        return;
      } catch (err) {}
    }
    navigator.clipboard.writeText(item.sourceUrl || item.mediaUrl);
    showToast({ text: 'Post link copied to clipboard!', duration: 3000 });
  };

  return (
    <div className="absolute right-3 bottom-16 sm:bottom-20 z-30 flex flex-col items-center space-y-3.5 select-none pointer-events-auto">
      {/* 1. Source Icon / Link */}
      <a
        href={item.sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={e => e.stopPropagation()}
        className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-blue-600/80 hover:border-blue-400 transition-all shadow-lg active:scale-95 group"
        title={`View on ${item.sourceName}`}
      >
        <span className="text-xs font-bold uppercase tracking-wider">
          {item.sourceName.substring(0, 3)}
        </span>
        <ExternalLink size={10} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity" />
      </a>

      {/* 2. Favorite Heart Button */}
      <button
        onClick={handleFavorite}
        className={`w-11 h-11 rounded-full backdrop-blur-md border flex items-center justify-center transition-all shadow-lg active:scale-90 ${
          favorited
            ? 'bg-red-500/90 border-red-400 text-white shadow-red-500/30'
            : 'bg-black/60 border-white/10 text-white hover:bg-black/80'
        }`}
        title="Favorite"
      >
        <Heart size={20} className={favorited ? 'fill-white' : ''} />
      </button>

      {/* 3. Tag Drawer Button with Badge */}
      <button
        onClick={e => {
          e.stopPropagation();
          onOpenTagDrawer();
        }}
        className="relative w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-all shadow-lg active:scale-90"
        title="Inspect Tags & Blacklist"
      >
        <Tag size={20} />
        {tagCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
            {tagCount > 99 ? '99+' : tagCount}
          </span>
        )}
      </button>

      {/* 4. Audio Control with Volume Slider Popup */}
      <div
        className="relative flex items-center justify-center"
        onMouseEnter={() => setShowVolumeSlider(true)}
        onMouseLeave={() => setShowVolumeSlider(false)}
      >
        <button
          onClick={e => {
            e.stopPropagation();
            toggleMute();
          }}
          className={`w-11 h-11 rounded-full backdrop-blur-md border flex items-center justify-center transition-all shadow-lg active:scale-90 ${
            isMuted
              ? 'bg-black/60 border-white/10 text-zinc-400'
              : 'bg-blue-600 border-blue-400 text-white shadow-blue-500/30'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        {/* Floating Volume Slider on Desktop Hover or Tap */}
        {showVolumeSlider && !isMuted && (
          <div
            className="absolute right-14 bg-black/80 backdrop-blur-md border border-white/10 rounded-full px-3 py-2 flex items-center shadow-xl z-40"
            onClick={e => e.stopPropagation()}
          >
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={e => setVolume(parseFloat(e.target.value))}
              className="w-20 accent-blue-500 cursor-pointer h-1.5"
            />
          </div>
        )}
      </div>

      {/* 5. Fit / Fill Toggle Button */}
      <button
        onClick={e => {
          e.stopPropagation();
          toggleFitMode();
        }}
        className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-all shadow-lg active:scale-90"
        title={fitMode === 'contain' ? 'Fill Screen (Cover)' : 'Fit Entire Media (Contain)'}
      >
        {fitMode === 'contain' ? <Maximize2 size={18} /> : <Minimize2 size={18} />}
      </button>

      {/* 6. Download Button */}
      <button
        onClick={handleDownload}
        className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-all shadow-lg active:scale-90"
        title="Download Media"
      >
        <Download size={18} />
      </button>

      {/* 7. Share Button */}
      <button
        onClick={handleShare}
        className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-all shadow-lg active:scale-90"
        title="Share Post"
      >
        <Share2 size={18} />
      </button>
    </div>
  );
};
