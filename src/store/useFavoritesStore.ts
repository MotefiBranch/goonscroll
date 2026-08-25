import { create } from 'zustand';
import { FeedItem } from '../types/feed';
import { fetchFavorites, toggleFavoriteApi } from '../api/client';

interface FavoritesState {
  favorites: FeedItem[];
  favoriteIds: Set<string>;
  isLoading: boolean;
  initFavorites: () => Promise<void>;
  toggleFavorite: (item: FeedItem) => Promise<boolean>;
  isFavorited: (id: string) => boolean;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  favorites: [],
  favoriteIds: new Set<string>(),
  isLoading: false,

  initFavorites: async () => {
    try {
      set({ isLoading: true });
      const favs = await fetchFavorites();
      set({
        favorites: favs,
        favoriteIds: new Set(favs.map(f => f.id)),
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to load favorites:', err);
      set({ isLoading: false });
    }
  },

  toggleFavorite: async item => {
    const currentIds = new Set(get().favoriteIds);
    const wasFavorited = currentIds.has(item.id);

    // Optimistic UI update
    if (wasFavorited) {
      currentIds.delete(item.id);
      set(state => ({
        favorites: state.favorites.filter(f => f.id !== item.id),
        favoriteIds: currentIds,
      }));
    } else {
      currentIds.add(item.id);
      set(state => ({
        favorites: [item, ...state.favorites.filter(f => f.id !== item.id)],
        favoriteIds: currentIds,
      }));
    }

    try {
      const res = await toggleFavoriteApi(item);
      const isNowFav = Boolean(res.isFavorited);

      // Align state with confirmed server response
      const finalIds = new Set(get().favoriteIds);
      if (isNowFav) {
        finalIds.add(item.id);
        set(state => ({
          favorites: [item, ...state.favorites.filter(f => f.id !== item.id)],
          favoriteIds: finalIds,
        }));
      } else {
        finalIds.delete(item.id);
        set(state => ({
          favorites: state.favorites.filter(f => f.id !== item.id),
          favoriteIds: finalIds,
        }));
      }

      return isNowFav;
    } catch (err) {
      console.error('Failed to sync favorite toggle with server:', err);
      get().initFavorites();
      return wasFavorited;
    }
  },

  isFavorited: id => {
    return get().favoriteIds.has(id);
  },
}));
