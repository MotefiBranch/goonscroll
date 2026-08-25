import React, { useState, useEffect, useRef } from 'react';
import { Search, Settings, SplitSquareVertical, X } from 'lucide-react';
import { useFeedStore } from '../store/useFeedStore';
import { fetchAutocomplete } from '../api/client';

interface TopNavProps {
  onOpenSettings: () => void;
}

const SOURCES = [
  { id: 'rule34', name: 'Rule34', icon: '🎨' },
  { id: 'e621', name: 'e621', icon: '🐾' },
  { id: 'danbooru', name: 'Danbooru', icon: '🌸' },
  { id: 'yande', name: 'Yande.re', icon: '👘' },
  { id: 'konachan', name: 'Konachan', icon: '🐱' },
  { id: 'rule34paheal', name: 'Rule34 Paheal', icon: '⚡' },
  { id: 'xbooru', name: 'Xbooru', icon: '🔞' },
  { id: 'reddit', name: 'Reddit', icon: '👽' },
];

export const TopNav: React.FC<TopNavProps> = ({ onOpenSettings }) => {
  const { source, setSource, searchTags, setSearchTags, isDualPane, toggleDualPane } = useFeedStore();
  const [searchInput, setSearchInput] = useState(searchTags);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Sync external searchTags changes
  useEffect(() => {
    setSearchInput(searchTags);
  }, [searchTags]);

  // Autocomplete debounce
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      const parts = trimmed.split(/\s+/);
      const lastWord = parts[parts.length - 1];
      if (lastWord.length >= 2) {
        const results = await fetchAutocomplete(source, lastWord);
        setSuggestions(results);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchInput, source]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    setSearchTags(searchInput.trim());
  };

  const handleSelectSuggestion = (tag: string) => {
    const parts = searchInput.trim().split(/\s+/);
    parts[parts.length - 1] = tag;
    const newSearch = parts.join(' ') + ' ';
    setSearchInput(newSearch);
    setShowSuggestions(false);
    setSearchTags(newSearch.trim());
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchTags('');
  };

  return (
    <header
      className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3 pb-2.5 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-auto select-none"
      style={{ paddingTop: 'max(10px, env(safe-area-inset-top, 0px))' }}
    >
      {/* Source Selector Dropdown */}
      <div className="flex items-center space-x-2">
        <select
          value={source}
          onChange={e => setSource(e.target.value)}
          className="bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs sm:text-sm font-semibold rounded-full px-3 py-1.5 outline-none cursor-pointer hover:bg-black/80 transition-all"
        >
          {SOURCES.map(s => (
            <option key={s.id} value={s.id} className="bg-zinc-900 text-white">
              {s.icon} {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Search Input Bar with Autocomplete */}
      <div ref={searchRef} className="relative flex-1 max-w-md mx-2 sm:mx-4">
        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <input
            type="text"
            value={searchInput}
            onChange={e => {
              setSearchInput(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search tags (e.g. catgirl solo)..."
            className="w-full bg-black/60 backdrop-blur-md border border-white/10 rounded-full pl-9 pr-8 py-1.5 text-xs sm:text-sm text-white placeholder-zinc-400 outline-none focus:border-blue-500 transition-all"
          />
          <Search size={15} className="absolute left-3 text-zinc-400 pointer-events-none" />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2.5 text-zinc-400 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </form>

        {/* Autocomplete Dropdown List */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-900/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 max-h-56 overflow-y-auto scrollable-area">
            {suggestions.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => handleSelectSuggestion(tag)}
                className="w-full px-3.5 py-2 text-left text-xs sm:text-sm text-zinc-200 hover:bg-blue-600 hover:text-white transition-colors flex items-center justify-between"
              >
                <span>#{tag}</span>
                <span className="text-[10px] text-zinc-400">select</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Controls: Dual Pane & Settings */}
      <div className="flex items-center space-x-2">
        <button
          onClick={toggleDualPane}
          className={`p-2 rounded-full backdrop-blur-md border transition-all ${
            isDualPane
              ? 'bg-blue-600 border-blue-400 text-white'
              : 'bg-black/60 border-white/10 text-zinc-300 hover:bg-black/80'
          }`}
          title="Toggle Dual Feed Pane"
        >
          <SplitSquareVertical size={18} />
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-zinc-300 hover:text-white hover:bg-black/80 transition-all active:scale-95"
          title="Settings & Blacklist"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
};
