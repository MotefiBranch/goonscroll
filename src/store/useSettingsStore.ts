import { create } from 'zustand';
import { AppSettings, UserPreferences } from '../types/feed';
import { fetchSettings, updateSettings, addBlacklistTag, removeBlacklistTag, addFavoriteTag, removeFavoriteTag } from '../api/client';

interface SettingsState {
  settings: AppSettings | null;
  isLoading: boolean;
  volume: number;
  isMuted: boolean;
  fitMode: 'contain' | 'cover';
  initSettings: () => Promise<void>;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleFitMode: () => void;
  addTagToBlacklist: (tag: string, source?: string) => Promise<void>;
  removeTagFromBlacklist: (tag: string, source?: string) => Promise<void>;
  addTagToFavorites: (tag: string, source?: string) => Promise<void>;
  removeTagFromFavorites: (tag: string, source?: string) => Promise<void>;
  updateUserPreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  setFullSettings: (newSettings: AppSettings) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: null,
  isLoading: false,
  volume: 0.8,
  isMuted: true,
  fitMode: 'contain',

  initSettings: async () => {
    try {
      set({ isLoading: true });
      const data = await fetchSettings();
      set({
        settings: data,
        volume: data.preferences?.defaultVolume ?? 0.8,
        isMuted: data.preferences?.mutedByDefault ?? true,
        fitMode: data.preferences?.fitMode ?? 'contain',
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to init settings:', err);
      set({ isLoading: false });
    }
  },

  setVolume: v => {
    const clamped = Math.max(0, Math.min(1, v));
    set({ volume: clamped, isMuted: clamped === 0 });
    // Update preference on server
    updateSettings({ preferences: { defaultVolume: clamped } as any }).catch(() => {});
  },

  toggleMute: () => {
    const nextMuted = !get().isMuted;
    set({ isMuted: nextMuted });
  },

  toggleFitMode: () => {
    const next = get().fitMode === 'contain' ? 'cover' : 'contain';
    set({ fitMode: next });
    updateSettings({ preferences: { fitMode: next } as any }).catch(() => {});
  },

  addTagToBlacklist: async (tag: string, source: string = 'global') => {
    const cleanTag = tag.trim().toLowerCase();
    if (!cleanTag) return;
    try {
      const updatedBlacklist = await addBlacklistTag(cleanTag, source);
      set(state => ({
        settings: state.settings ? { ...state.settings, blacklist: updatedBlacklist } : state.settings,
      }));
    } catch (err) {
      console.error('Failed to add tag to blacklist:', err);
    }
  },

  removeTagFromBlacklist: async (tag: string, source: string = 'global') => {
    const cleanTag = tag.trim().toLowerCase();
    if (!cleanTag) return;
    try {
      const updatedBlacklist = await removeBlacklistTag(cleanTag, source);
      set(state => ({
        settings: state.settings ? { ...state.settings, blacklist: updatedBlacklist } : state.settings,
      }));
    } catch (err) {
      console.error('Failed to remove tag from blacklist:', err);
    }
  },

  addTagToFavorites: async (tag: string, source: string = 'global') => {
    const cleanTag = tag.trim().toLowerCase();
    if (!cleanTag) return;
    try {
      const updatedFavoriteTags = await addFavoriteTag(cleanTag, source);
      set(state => ({
        settings: state.settings ? { ...state.settings, favoriteTags: updatedFavoriteTags } : state.settings,
      }));
    } catch (err) {
      console.error('Failed to add tag to favorites:', err);
    }
  },

  removeTagFromFavorites: async (tag: string, source: string = 'global') => {
    const cleanTag = tag.trim().toLowerCase();
    if (!cleanTag) return;
    try {
      const updatedFavoriteTags = await removeFavoriteTag(cleanTag, source);
      set(state => ({
        settings: state.settings ? { ...state.settings, favoriteTags: updatedFavoriteTags } : state.settings,
      }));
    } catch (err) {
      console.error('Failed to remove tag from favorites:', err);
    }
  },

  updateUserPreferences: async prefs => {
    try {
      const updated = await updateSettings({ preferences: prefs as any });
      set({ settings: updated });
    } catch (err) {
      console.error('Failed to update preferences:', err);
    }
  },

  setFullSettings: newSettings => {
    set({
      settings: newSettings,
      volume: newSettings.preferences?.defaultVolume ?? 0.8,
      isMuted: newSettings.preferences?.mutedByDefault ?? true,
      fitMode: newSettings.preferences?.fitMode ?? 'contain',
    });
  },
}));
