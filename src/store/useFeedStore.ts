import { create } from 'zustand';
import { FeedItem } from '../types/feed';
import { fetchFeed } from '../api/client';
import { useSettingsStore } from './useSettingsStore';

interface FeedState {
  source: string;
  searchTags: string;
  items: FeedItem[];
  currentIndex: number;
  page: number;
  favPage: number;
  isLoading: boolean;
  hasMore: boolean;
  isDualPane: boolean;
  lastError: string | null;
  setSource: (source: string) => void;
  setSearchTags: (tags: string) => void;
  toggleDualPane: () => void;
  loadInitialFeed: () => Promise<void>;
  retry: () => Promise<void>;
  fetchNextPage: () => Promise<void>;
  setCurrentIndex: (index: number) => void;
  nextItem: () => void;
  prevItem: () => void;
  removeTagFromLoadedFeed: (tag: string) => number;
}

/**
 * Interleaves main posts with favorite tag posts based on salting pattern.
 */
function interleaveFeed(
  mainItems: FeedItem[],
  favItems: FeedItem[],
  pattern: 'jitter' | '1in3' | '1in5' | 'off',
  saltedTag: string,
  existingIds: Set<string>
): FeedItem[] {
  if (pattern === 'off' || favItems.length === 0) {
    return mainItems.filter(i => !existingIds.has(i.id));
  }

  const result: FeedItem[] = [];
  const availableFavs = [...favItems].filter(i => !existingIds.has(i.id));

  // Determine gap step
  let step = 3;
  if (pattern === '1in3') step = 3;
  else if (pattern === '1in5') step = 5;

  let mainCount = 0;
  let nextJitterTarget = pattern === 'jitter' ? 2 + Math.floor(Math.random() * 3) : step; // 2, 3, or 4

  for (const item of mainItems) {
    if (existingIds.has(item.id)) continue;

    result.push(item);
    existingIds.add(item.id);
    mainCount++;

    const shouldInject = pattern === 'jitter' ? (mainCount >= nextJitterTarget) : (mainCount % step === 0);

    if (shouldInject && availableFavs.length > 0) {
      const fav = availableFavs.shift()!;
      if (!existingIds.has(fav.id)) {
        fav.isFavoritedSalt = true;
        fav.saltedTag = saltedTag;
        result.push(fav);
        existingIds.add(fav.id);
      }
      mainCount = 0;
      if (pattern === 'jitter') {
        nextJitterTarget = 2 + Math.floor(Math.random() * 3);
      }
    }
  }

  return result;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  source: 'rule34',
  searchTags: '',
  items: [],
  currentIndex: 0,
  page: 1,
  favPage: 1,
  isLoading: false,
  hasMore: true,
  isDualPane: false,

  lastError: null,

  retry: async () => {
    await get().loadInitialFeed();
  },

  setSource: source => {
    if (get().source === source) return;
    set({ source, items: [], currentIndex: 0, page: 1, favPage: 1, hasMore: true, lastError: null });
    get().loadInitialFeed();
  },

  setSearchTags: searchTags => {
    set({ searchTags, items: [], currentIndex: 0, page: 1, favPage: 1, hasMore: true, lastError: null });
    get().loadInitialFeed();
  },

  toggleDualPane: () => {
    set(state => ({ isDualPane: !state.isDualPane }));
  },

  loadInitialFeed: async () => {
    const { source, searchTags } = get();
    set({ isLoading: true, items: [], currentIndex: 0, page: 1, favPage: 1, hasMore: true, lastError: null });

    try {
      const settings = useSettingsStore.getState().settings;
      const globalFavs = settings?.favoriteTags?.global || [];
      const sourceFavs = settings?.favoriteTags?.bySource?.[source] || [];
      const effectiveFavs = Array.from(new Set([...globalFavs, ...sourceFavs]));
      const pattern = settings?.preferences?.favoriteSaltingPattern || 'jitter';

      const isHomeFeed = !searchTags || searchTags.trim() === '';
      const shouldSalt = isHomeFeed && pattern !== 'off' && effectiveFavs.length > 0;

      // 1. Fetch main feed
      const mainPromise = fetchFeed({ source, tags: searchTags, page: 1, limit: 40 });

      // 2. If salting, pick a random favorite tag and fetch a small batch
      let favPromise: Promise<{ items: FeedItem[] }> = Promise.resolve({ items: [] });
      let chosenFavTag = '';
      if (shouldSalt) {
        chosenFavTag = effectiveFavs[Math.floor(Math.random() * effectiveFavs.length)];
        favPromise = fetchFeed({ source, tags: chosenFavTag, page: 1, limit: 12 }).catch(() => ({ items: [] }));
      }

      const [mainRes, favRes] = await Promise.all([mainPromise, favPromise]);

      const seenIds = new Set<string>();
      const combinedItems = shouldSalt
        ? interleaveFeed(mainRes.items, favRes.items, pattern, chosenFavTag, seenIds)
        : mainRes.items;

      set({
        items: combinedItems,
        page: 2,
        favPage: 2,
        isLoading: false,
        hasMore: combinedItems.length > 0,
        lastError: combinedItems.length === 0 ? 'No posts returned from source' : null,
      });
    } catch (err: any) {
      console.error('Failed to load initial feed:', err);
      set({ isLoading: false, hasMore: false, lastError: err.message || String(err) });
    }
  },

  fetchNextPage: async () => {
    const { source, searchTags, page, favPage, isLoading, hasMore, items } = get();
    if (isLoading || !hasMore) return;

    set({ isLoading: true });
    try {
      const settings = useSettingsStore.getState().settings;
      const globalFavs = settings?.favoriteTags?.global || [];
      const sourceFavs = settings?.favoriteTags?.bySource?.[source] || [];
      const effectiveFavs = Array.from(new Set([...globalFavs, ...sourceFavs]));
      const pattern = settings?.preferences?.favoriteSaltingPattern || 'jitter';

      const isHomeFeed = !searchTags || searchTags.trim() === '';
      const shouldSalt = isHomeFeed && pattern !== 'off' && effectiveFavs.length > 0;

      const mainPromise = fetchFeed({ source, tags: searchTags, page, limit: 40 });

      let favPromise: Promise<{ items: FeedItem[] }> = Promise.resolve({ items: [] });
      let chosenFavTag = '';
      if (shouldSalt) {
        chosenFavTag = effectiveFavs[Math.floor(Math.random() * effectiveFavs.length)];
        favPromise = fetchFeed({ source, tags: chosenFavTag, page: favPage, limit: 12 }).catch(() => ({ items: [] }));
      }

      const [mainRes, favRes] = await Promise.all([mainPromise, favPromise]);

      if (mainRes.items.length === 0 && favRes.items.length === 0) {
        set({ hasMore: false, isLoading: false });
      } else {
        const existingIds = new Set(items.map(i => i.id));
        const newMixed = shouldSalt
          ? interleaveFeed(mainRes.items, favRes.items, pattern, chosenFavTag, existingIds)
          : mainRes.items.filter(i => !existingIds.has(i.id));

        set({
          items: [...items, ...newMixed],
          page: page + 1,
          favPage: favPage + 1,
          isLoading: false,
          hasMore: mainRes.items.length > 0,
        });
      }
    } catch (err) {
      console.error('Failed to fetch next page:', err);
      set({ isLoading: false });
    }
  },

  setCurrentIndex: index => {
    const { items, fetchNextPage } = get();
    const clamped = Math.max(0, Math.min(items.length - 1, index));
    set({ currentIndex: clamped });

    if (clamped >= items.length - 4) {
      fetchNextPage();
    }
  },

  nextItem: () => {
    const { currentIndex, items, setCurrentIndex } = get();
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  },

  prevItem: () => {
    const { currentIndex, setCurrentIndex } = get();
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  },

  removeTagFromLoadedFeed: (tag: string) => {
    const cleanTag = tag.trim().toLowerCase();
    if (!cleanTag) return 0;

    const { items, currentIndex } = get();
    const filtered: FeedItem[] = [];
    let removedCount = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const hasTag = item.tags?.all?.some(t => t.toLowerCase().trim() === cleanTag);
      if (hasTag) {
        removedCount++;
      } else {
        filtered.push(item);
      }
    }

    if (removedCount > 0) {
      const nextIndex = Math.min(currentIndex, Math.max(0, filtered.length - 1));
      set({
        items: filtered,
        currentIndex: nextIndex,
      });

      if (filtered.length < 5) {
        get().fetchNextPage();
      }
    }

    return removedCount;
  },
}));
