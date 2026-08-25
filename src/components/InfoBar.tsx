import React from 'react';
import { Sparkles } from 'lucide-react';
import { FeedItem } from '../types/feed';

interface InfoBarProps {
  item: FeedItem;
  onTagClick: (tag: string) => void;
}

export const InfoBar: React.FC<InfoBarProps> = ({ item, onTagClick }) => {
  const topTags = item.tags?.all?.slice(0, 4) || [];

  return (
    <div className="absolute left-3 bottom-4 sm:bottom-6 z-20 max-w-[70%] sm:max-w-[50%] pointer-events-auto select-none">
      <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 rounded-xl backdrop-blur-[2px]">
        {/* Favorite Salt Badge */}
        {item.isFavoritedSalt && item.saltedTag && (
          <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[11px] font-bold mb-1.5 shadow-sm">
            <Sparkles size={11} className="text-amber-400 fill-amber-400 animate-pulse" />
            <span>From your Favorites: #{item.saltedTag}</span>
          </div>
        )}

        {/* Source & Score */}
        <div className="flex items-center space-x-2 mb-1.5">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-600/80 text-white">
            {item.sourceName}
          </span>
          {item.score > 0 && (
            <span className="text-xs text-zinc-300 font-medium">
              ★ {item.score}
            </span>
          )}
          {item.author && (
            <span className="text-xs text-zinc-400 truncate">
              by {item.author}
            </span>
          )}
        </div>

        {/* Tag chips preview */}
        <div className="flex flex-wrap gap-1.5 mt-1">
          {topTags.map(tag => (
            <button
              key={tag}
              onClick={e => {
                e.stopPropagation();
                onTagClick(tag);
              }}
              className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-zinc-200 transition-colors"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
