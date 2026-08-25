import React, { useState, useRef, useEffect } from 'react';
import { Ban, Search, Copy, Check, Star } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useFeedStore } from '../store/useFeedStore';
import { useToastStore } from '../store/useToastStore';

export type TagCategory = 'artist' | 'character' | 'copyright' | 'general' | 'meta';

interface TagBadgeProps {
  tag: string;
  category: TagCategory;
  sourceId: string;
  onCloseDrawer?: () => void;
}

export const TagBadge: React.FC<TagBadgeProps> = ({
  tag,
  category,
  sourceId,
  onCloseDrawer,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [placement, setPlacement] = useState<'top' | 'bottom'>('top');
  const [align, setAlign] = useState<'left' | 'right'>('left');

  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { settings, addTagToBlacklist, addTagToFavorites, removeTagFromFavorites } = useSettingsStore();
  const { setSearchTags, removeTagFromLoadedFeed } = useFeedStore();
  const { showToast } = useToastStore();

  const cleanTag = tag.trim().toLowerCase();
  const isGlobalFav = settings?.favoriteTags?.global?.includes(cleanTag) ?? false;
  const isSourceFav = settings?.favoriteTags?.bySource?.[sourceId]?.includes(cleanTag) ?? false;
  const isFavorited = isGlobalFav || isSourceFav;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMenu]);

  // Color styles based on tag category
  const categoryStyles: Record<TagCategory, string> = {
    artist: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30 hover:bg-yellow-500/25',
    character: 'bg-green-500/15 text-green-300 border-green-500/30 hover:bg-green-500/25',
    copyright: 'bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25',
    meta: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30 hover:bg-zinc-500/25',
    general: 'bg-blue-500/15 text-blue-300 border-blue-500/30 hover:bg-blue-500/25',
  };

  const toggleMenu = () => {
    if (!showMenu && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceRight = window.innerWidth - rect.left;

      // If chip is in the top 55% of the viewport, open downwards to prevent top cutoff.
      // If chip is in the bottom 45%, open upwards.
      const shouldOpenDown = rect.top < viewportHeight * 0.55;
      setPlacement(shouldOpenDown ? 'bottom' : 'top');
      setAlign(spaceRight < 260 ? 'right' : 'left');
    }
    setShowMenu(!showMenu);
  };

  const handleSearch = () => {
    setSearchTags(tag);
    setShowMenu(false);
    onCloseDrawer?.();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(tag);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setShowMenu(false);
    }, 1200);
  };

  const handleToggleFavorite = async (scope: 'global' | string) => {
    setShowMenu(false);
    const isCurrentlyFavorited = scope === 'global' ? isGlobalFav : isSourceFav;

    if (isCurrentlyFavorited) {
      await removeTagFromFavorites(tag, scope);
      showToast({
        text: `Removed "${tag}" from ${scope === 'global' ? 'Global' : sourceId} Favorites`,
        duration: 3500,
      });
    } else {
      await addTagToFavorites(tag, scope);
      showToast({
        text: `⭐ Added "${tag}" to ${scope === 'global' ? 'Global' : sourceId} Favorites (Will salt into Home feed)`,
        duration: 4500,
      });
    }
  };

  const handleBlacklist = async (scope: 'global' | string) => {
    setShowMenu(false);
    onCloseDrawer?.();

    await addTagToBlacklist(tag, scope);
    const purgedCount = removeTagFromLoadedFeed(tag);

    showToast({
      text: `Added "${tag}" to ${scope === 'global' ? 'Global' : sourceId} Blacklist (${purgedCount} matching posts removed)`,
      duration: 4500,
    });
  };

  return (
    <div ref={menuRef} className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all active:scale-95 flex items-center space-x-1.5 ${
          categoryStyles[category] || categoryStyles.general
        }`}
      >
        {isFavorited && <Star size={11} className="text-yellow-400 fill-yellow-400" />}
        <span>{tag}</span>
      </button>

      {/* Action Popover Menu with robust adaptive viewport positioning */}
      {showMenu && (
        <div
          className={`absolute ${
            placement === 'top' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } ${
            align === 'right' ? 'right-0' : 'left-0'
          } w-60 max-h-[min(340px,75vh)] overflow-y-auto scrollbar-none bg-zinc-900 border border-white/10 rounded-xl shadow-2xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150`}
        >
          <div className="px-2 py-1 font-bold text-zinc-300 border-b border-white/5 truncate mb-1 flex items-center justify-between">
            <span>#{tag}</span>
            {isFavorited && <span className="text-[10px] text-yellow-400 font-normal">⭐ Starred</span>}
          </div>

          <button
            onClick={handleSearch}
            className="w-full px-2 py-1.5 rounded-lg text-left text-zinc-200 hover:bg-blue-600 hover:text-white flex items-center space-x-2 transition-colors"
          >
            <Search size={13} />
            <span>Search this tag</span>
          </button>

          <button
            onClick={handleCopy}
            className="w-full px-2 py-1.5 rounded-lg text-left text-zinc-200 hover:bg-zinc-800 flex items-center space-x-2 transition-colors"
          >
            {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
            <span>{copied ? 'Copied!' : 'Copy tag name'}</span>
          </button>

          <div className="my-1 border-t border-white/10"></div>

          {/* Favorite Tag Actions */}
          <button
            onClick={() => handleToggleFavorite('global')}
            className="w-full px-2 py-1.5 rounded-lg text-left text-yellow-400 hover:bg-yellow-500/20 flex items-center space-x-2 transition-colors font-medium"
          >
            <Star size={13} className={isGlobalFav ? 'fill-yellow-400' : ''} />
            <span>{isGlobalFav ? 'Remove Global Favorite' : 'Favorite Tag (Global)'}</span>
          </button>

          <button
            onClick={() => handleToggleFavorite(sourceId)}
            className="w-full px-2 py-1.5 rounded-lg text-left text-amber-300 hover:bg-amber-500/20 flex items-center space-x-2 transition-colors font-medium"
          >
            <Star size={13} className={isSourceFav ? 'fill-amber-300' : ''} />
            <span>{isSourceFav ? `Remove ${sourceId} Favorite` : `Favorite Tag (${sourceId})`}</span>
          </button>

          <div className="my-1 border-t border-white/10"></div>

          {/* Blacklist Actions */}
          <button
            onClick={() => handleBlacklist('global')}
            className="w-full px-2 py-1.5 rounded-lg text-left text-red-400 hover:bg-red-500/20 flex items-center space-x-2 transition-colors font-medium"
          >
            <Ban size={13} />
            <span>Add to Global Blacklist</span>
          </button>

          <button
            onClick={() => handleBlacklist(sourceId)}
            className="w-full px-2 py-1.5 rounded-lg text-left text-orange-400 hover:bg-orange-500/20 flex items-center space-x-2 transition-colors font-medium"
          >
            <Ban size={13} />
            <span>Add to {sourceId} Blacklist</span>
          </button>
        </div>
      )}
    </div>
  );
};
