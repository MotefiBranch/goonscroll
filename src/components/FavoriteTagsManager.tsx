import React, { useState } from 'react';
import { Plus, X, Search, FileText, Download, Star, Sparkles, Sliders } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useToastStore } from '../store/useToastStore';
import { FavoriteSaltingPattern } from '../types/feed';

const SCOPES = [
  { id: 'global', label: 'Global (All Sources)' },
  { id: 'rule34', label: 'Rule34' },
  { id: 'e621', label: 'e621' },
  { id: 'danbooru', label: 'Danbooru' },
  { id: 'yande', label: 'Yande.re' },
  { id: 'konachan', label: 'Konachan' },
  { id: 'rule34paheal', label: 'Rule34 Paheal' },
  { id: 'xbooru', label: 'Xbooru' },
  { id: 'reddit', label: 'Reddit' },
];

const SALTING_PATTERNS: { id: FavoriteSaltingPattern; label: string; desc: string }[] = [
  { id: 'jitter', label: '🎲 Organic Jitter', desc: 'Randomly inserts a favorite every 2 to 4 posts' },
  { id: '1in3', label: '⚡ 1 in 3 (Frequent)', desc: 'Inserts a favorite post every 3 posts' },
  { id: '1in5', label: '🌿 1 in 5 (Subtle)', desc: 'Inserts a favorite post every 5 posts' },
  { id: 'off', label: '🚫 Off', desc: 'Disables favorite tag salting on Home feed' },
];

export const FavoriteTagsManager: React.FC = () => {
  const { settings, addTagToFavorites, removeTagFromFavorites, updateUserPreferences } = useSettingsStore();
  const { showToast } = useToastStore();

  const [activeScope, setActiveScope] = useState('global');
  const [newTagInput, setNewTagInput] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const favoriteTags = settings?.favoriteTags || { global: [], bySource: {} };
  const currentPattern = settings?.preferences?.favoriteSaltingPattern || 'jitter';

  const currentTags: string[] =
    activeScope === 'global'
      ? favoriteTags.global || []
      : favoriteTags.bySource?.[activeScope] || [];

  const filteredTags = currentTags.filter(t =>
    t.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  const handlePatternChange = async (pattern: FavoriteSaltingPattern) => {
    await updateUserPreferences({ favoriteSaltingPattern: pattern });
    showToast({
      text: `Salting pattern updated to: ${SALTING_PATTERNS.find(p => p.id === pattern)?.label}`,
      duration: 3000,
    });
  };

  const handleAddTag = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = newTagInput.trim();
    if (!raw) return;

    const tagsToAdd = raw.split(/[, ]+/).map(t => t.trim().toLowerCase()).filter(Boolean);
    for (const t of tagsToAdd) {
      await addTagToFavorites(t, activeScope);
    }

    setNewTagInput('');
    showToast({
      text: `⭐ Added ${tagsToAdd.length} favorite tag(s) to ${activeScope === 'global' ? 'Global' : activeScope}`,
      duration: 3000,
    });
  };

  const handleRemoveTag = async (tag: string) => {
    await removeTagFromFavorites(tag, activeScope);

    showToast({
      text: `Removed "${tag}" from ${activeScope === 'global' ? 'Global' : activeScope} Favorites`,
      actionText: 'Undo',
      duration: 5000,
      onAction: async () => {
        await addTagToFavorites(tag, activeScope);
      },
    });
  };

  const handleBulkImport = async () => {
    const lines = bulkText
      .split(/[\n, ]+/)
      .map(t => t.trim().toLowerCase())
      .filter(Boolean);

    if (lines.length === 0) return;

    for (const t of lines) {
      await addTagToFavorites(t, activeScope);
    }

    setBulkText('');
    setShowBulkImport(false);
    showToast({
      text: `Imported ${lines.length} favorite tag(s) into ${activeScope}`,
      duration: 4000,
    });
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(currentTags.join(', '));
    showToast({ text: 'Copied all favorite tags to clipboard!', duration: 3000 });
  };

  return (
    <div className="flex flex-col space-y-4 select-none">
      {/* Salting Pattern Density Selector */}
      <div className="bg-zinc-900/90 border border-amber-500/20 rounded-xl p-3 space-y-2 shadow-sm">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-400">
          <Sparkles size={15} />
          <span>Home Feed Salting Density (Interleaving Ratio)</span>
        </div>
        <p className="text-[11px] text-zinc-400 leading-tight">
          How frequently posts from your favorite tags should be sprinkled into the Home feed:
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          {SALTING_PATTERNS.map(pat => (
            <button
              key={pat.id}
              onClick={() => handlePatternChange(pat.id)}
              className={`p-2 rounded-lg border text-left transition-all ${
                currentPattern === pat.id
                  ? 'bg-amber-500/15 border-amber-500/60 text-amber-300 shadow-md ring-1 ring-amber-500/40'
                  : 'bg-zinc-950/50 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <div className="text-xs font-bold">{pat.label}</div>
              <div className="text-[10px] text-zinc-400 mt-0.5 leading-tight">{pat.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Scope Selector Tabs */}
      <div className="flex overflow-x-auto pb-1.5 space-x-1.5 scrollbar-none border-b border-white/10">
        {SCOPES.map(scope => {
          const count =
            scope.id === 'global'
              ? (favoriteTags.global || []).length
              : (favoriteTags.bySource?.[scope.id] || []).length;

          return (
            <button
              key={scope.id}
              onClick={() => {
                setActiveScope(scope.id);
                setSearchFilter('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                activeScope === scope.id
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              <Star size={11} className={activeScope === scope.id ? 'fill-white' : ''} />
              <span>{scope.label}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeScope === scope.id ? 'bg-amber-800 text-white' : 'bg-zinc-700 text-zinc-300'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Add Tag Bar */}
      <form onSubmit={handleAddTag} className="flex space-x-2">
        <input
          type="text"
          value={newTagInput}
          onChange={e => setNewTagInput(e.target.value)}
          placeholder={`Add favorite tags to ${activeScope === 'global' ? 'Global' : activeScope} (comma separated)...`}
          className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-amber-500 transition-all"
        />
        <button
          type="submit"
          disabled={!newTagInput.trim()}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center space-x-1 transition-all active:scale-95 shadow"
        >
          <Plus size={16} />
          <span>Star</span>
        </button>
      </form>

      {/* Search Filter & Bulk Action Controls */}
      <div className="flex items-center justify-between space-x-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            placeholder={`Filter ${currentTags.length} favorite tags...`}
            className="w-full bg-zinc-900/60 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-500"
          />
        </div>

        <button
          onClick={() => setShowBulkImport(!showBulkImport)}
          className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs flex items-center space-x-1 transition-colors"
          title="Bulk Import / Export"
        >
          <FileText size={14} />
          <span>Bulk</span>
        </button>

        {currentTags.length > 0 && (
          <button
            onClick={handleCopyAll}
            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs flex items-center space-x-1 transition-colors"
            title="Copy all tags"
          >
            <Download size={14} />
            <span>Copy</span>
          </button>
        )}
      </div>

      {/* Bulk Import Collapsible Panel */}
      {showBulkImport && (
        <div className="p-3 bg-zinc-900 border border-white/10 rounded-xl space-y-2 animate-in fade-in duration-200">
          <label className="text-xs font-semibold text-zinc-300">
            Paste favorite tags to star into {activeScope}:
          </label>
          <textarea
            rows={3}
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
            placeholder="catgirl, tomboy, goth, thighhighs..."
            className="w-full bg-zinc-950 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-amber-500 font-mono"
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowBulkImport(false)}
              className="px-3 py-1 text-xs text-zinc-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkImport}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg"
            >
              Import Favorite Tags
            </button>
          </div>
        </div>
      )}

      {/* Scrollable Tag Chips Container */}
      <div className="bg-zinc-950/60 border border-white/10 rounded-xl p-3 min-h-[140px] max-h-[260px] overflow-y-auto scrollable-area">
        {filteredTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {filteredTags.map(tag => (
              <div
                key={tag}
                className="group flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-xs font-medium hover:border-amber-500/60 transition-all shadow-sm"
              >
                <Star size={11} className="text-amber-400 fill-amber-400" />
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="p-1 -mr-1 rounded-md hover:bg-amber-500/30 text-amber-400 hover:text-white transition-colors active:scale-90"
                  title={`Remove ${tag} from favorites`}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-28 text-zinc-500 text-xs text-center">
            {searchFilter ? (
              <p>No favorite tags matched "{searchFilter}".</p>
            ) : (
              <p>No favorite tags in {activeScope}. Star tags above or tap ⭐ in the Tag Drawer to salt them into your Home feed!</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
