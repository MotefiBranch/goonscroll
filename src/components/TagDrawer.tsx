import React, { useState } from 'react';
import { X, Search, Tag, ExternalLink } from 'lucide-react';
import { FeedItem } from '../types/feed';
import { TagBadge, TagCategory } from './TagBadge';

interface TagDrawerProps {
  item: FeedItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TagDrawer: React.FC<TagDrawerProps> = ({ item, isOpen, onClose }) => {
  const [filterQuery, setFilterQuery] = useState('');

  if (!isOpen || !item) return null;

  const tags = item.tags || { all: [] };
  const artistTags = tags.artist || [];
  const characterTags = tags.character || [];
  const copyrightTags = tags.copyright || [];
  const metaTags = tags.meta || [];
  const generalTags = tags.general && tags.general.length > 0 ? tags.general : tags.all || [];

  const filterList = (list: string[]) => {
    if (!filterQuery) return list;
    return list.filter(t => t.toLowerCase().includes(filterQuery.toLowerCase()));
  };

  const renderSection = (title: string, list: string[], category: TagCategory, icon: string) => {
    const filtered = filterList(list);
    if (filtered.length === 0) return null;

    return (
      <div className="mb-4">
        <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
          <span>{icon}</span>
          <span>{title} ({filtered.length})</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {filtered.map(t => (
            <TagBadge
              key={t}
              tag={t}
              category={category}
              sourceId={item.sourceId}
              onCloseDrawer={onClose}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div
        className="w-full max-w-md h-full bg-[#101828] border-l border-white/10 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-4 pb-4 border-b border-white/10 flex items-center justify-between"
          style={{ paddingTop: 'max(16px, env(safe-area-inset-top, 0px))' }}
        >
          <div className="flex items-center space-x-2">
            <Tag size={18} className="text-blue-400" />
            <h2 className="text-base font-bold text-white">Post Tags & Info</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors active:scale-90"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        {/* Post Metadata Overview */}
        <div className="p-4 bg-zinc-900/50 border-b border-white/5 flex items-center justify-between text-xs text-zinc-300">
          <div>
            <span className="font-semibold text-white">{item.sourceName}</span>
            <span className="ml-2 text-zinc-400">Score: {item.score}</span>
          </div>
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 text-blue-400 hover:underline"
          >
            <span>Original Post</span>
            <ExternalLink size={12} />
          </a>
        </div>

        {/* Quick Tag Search Filter */}
        <div className="p-3 border-b border-white/5">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              placeholder="Filter tags..."
              className="w-full bg-zinc-900 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Scrollable Tag Content */}
        <div className="flex-1 overflow-y-auto p-4 scrollable-area">
          {renderSection('Artists', artistTags, 'artist', '🎨')}
          {renderSection('Characters', characterTags, 'character', '👤')}
          {renderSection('Copyrights / Series', copyrightTags, 'copyright', '🏢')}
          {renderSection('General Tags', generalTags, 'general', '🏷️')}
          {renderSection('Meta Tags', metaTags, 'meta', '⚙️')}

          {tags.all?.length === 0 && (
            <div className="text-center text-zinc-500 text-sm py-8">
              No tags available for this post.
            </div>
          )}
        </div>

        {/* Bottom Helper Hint */}
        <div className="p-3 bg-zinc-950/80 border-t border-white/5 text-[11px] text-zinc-400 text-center">
          💡 Tap any tag to search it or add it to your <span className="text-red-400 font-semibold">Blacklist</span>.
        </div>
      </div>
    </div>
  );
};
