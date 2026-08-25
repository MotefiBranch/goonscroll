import React, { useState } from 'react';
import { Plus, X, Search, FileText, Download, Upload, Trash2 } from 'lucide-react';
import { useSettingsStore } from '../store/useSettingsStore';
import { useToastStore } from '../store/useToastStore';

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

export const BlacklistManager: React.FC = () => {
  const { settings, addTagToBlacklist, removeTagFromBlacklist } = useSettingsStore();
  const { showToast } = useToastStore();

  const [activeScope, setActiveScope] = useState('global');
  const [newTagInput, setNewTagInput] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState('');

  const blacklist = settings?.blacklist || { global: [], bySource: {} };
  const currentTags: string[] =
    activeScope === 'global'
      ? blacklist.global || []
      : blacklist.bySource?.[activeScope] || [];

  const filteredTags = currentTags.filter(t =>
    t.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  const handleAddTag = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = newTagInput.trim();
    if (!raw) return;

    // Support comma or space separated input
    const tagsToAdd = raw.split(/[, ]+/).map(t => t.trim().toLowerCase()).filter(Boolean);
    for (const t of tagsToAdd) {
      await addTagToBlacklist(t, activeScope);
    }

    setNewTagInput('');
    showToast({
      text: `Added ${tagsToAdd.length} tag(s) to ${activeScope === 'global' ? 'Global' : activeScope} Blacklist`,
      duration: 3000,
    });
  };

  const handleRemoveTag = async (tag: string) => {
    await removeTagFromBlacklist(tag, activeScope);

    // Provide 5-second Undo mechanism
    showToast({
      text: `Removed "${tag}" from ${activeScope === 'global' ? 'Global' : activeScope} Blacklist`,
      actionText: 'Undo',
      duration: 5000,
      onAction: async () => {
        await addTagToBlacklist(tag, activeScope);
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
      await addTagToBlacklist(t, activeScope);
    }

    setBulkText('');
    setShowBulkImport(false);
    showToast({
      text: `Imported ${lines.length} tag(s) into ${activeScope} Blacklist`,
      duration: 4000,
    });
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(currentTags.join(', '));
    showToast({ text: 'Copied all blacklist tags to clipboard!', duration: 3000 });
  };

  return (
    <div className="flex flex-col space-y-4 select-none">
      {/* Scope Selector Tabs */}
      <div className="flex overflow-x-auto pb-1.5 space-x-1.5 scrollbar-none border-b border-white/10">
        {SCOPES.map(scope => {
          const count =
            scope.id === 'global'
              ? (blacklist.global || []).length
              : (blacklist.bySource?.[scope.id] || []).length;

          return (
            <button
              key={scope.id}
              onClick={() => {
                setActiveScope(scope.id);
                setSearchFilter('');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
                activeScope === scope.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700'
              }`}
            >
              <span>{scope.label}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeScope === scope.id ? 'bg-blue-800 text-white' : 'bg-zinc-700 text-zinc-300'
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
          placeholder={`Add tags to ${activeScope === 'global' ? 'Global' : activeScope} (comma separated)...`}
          className="flex-1 bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 outline-none focus:border-blue-500 transition-all"
        />
        <button
          type="submit"
          disabled={!newTagInput.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center space-x-1 transition-all active:scale-95 shadow"
        >
          <Plus size={16} />
          <span>Add</span>
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
            placeholder={`Filter ${currentTags.length} blocked tags...`}
            className="w-full bg-zinc-900/60 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500"
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

      {/* Bulk Import / Export Collapsible Panel */}
      {showBulkImport && (
        <div className="p-3 bg-zinc-900 border border-white/10 rounded-xl space-y-2 animate-in fade-in duration-200">
          <label className="text-xs font-semibold text-zinc-300">
            Paste tags to import into {activeScope}:
          </label>
          <textarea
            rows={3}
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
            placeholder="scat, fart, bad_anatomy, guro..."
            className="w-full bg-zinc-950 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-zinc-600 outline-none focus:border-blue-500 font-mono"
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
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg"
            >
              Import Tags
            </button>
          </div>
        </div>
      )}

      {/* Scrollable Tag Chips Container */}
      <div className="bg-zinc-950/60 border border-white/10 rounded-xl p-3 min-h-[160px] max-h-[280px] overflow-y-auto scrollable-area">
        {filteredTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {filteredTags.map(tag => (
              <div
                key={tag}
                className="group flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs font-medium hover:border-red-500/60 transition-all shadow-sm"
              >
                <span>#{tag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="p-1 -mr-1 rounded-md hover:bg-red-500/30 text-red-400 hover:text-white transition-colors active:scale-90"
                  title={`Remove ${tag} from blacklist`}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-32 text-zinc-500 text-xs text-center">
            {searchFilter ? (
              <p>No blacklisted tags matched "{searchFilter}".</p>
            ) : (
              <p>No blacklisted tags in {activeScope}. Type tags above to block unwanted content.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
