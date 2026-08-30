import { AppSettings, FeedItem } from '../types/feed';

const STORAGE_KEY_SETTINGS = 'goonscroll_native_settings';
const STORAGE_KEY_FAVORITES = 'goonscroll_native_favorites';

const DEFAULT_SETTINGS: AppSettings = {
  blacklist: {
    global: ['yaoi', 'gay', 'bbc', 'scat', 'fart', 'cartoon_network', 'hyper_ass', 'cellulite', 'about_to_pop', 'male_only'],
    bySource: {
      rule34: ['otoko_no_ko', 'ai_generated', 'flashgritz', 'malesub', 'creepypasta'],
      e621: [],
      danbooru: [],
      yande: [],
      konachan: [],
      rule34paheal: [],
      xbooru: [],
      reddit: [],
      gelbooru: [],
      realbooru: [],
    },
  },
  favoriteTags: {
    global: ['animated', 'curvy_female', 'futa_on_female', 'massive_ass'],
    bySource: {
      rule34: ['horse_girl', 'umamusume', 'digimon_(species)', 'renamon'],
      e621: ['palworld', 'big_butt', 'my_little_pony', 'friendship_is_magic'],
      danbooru: [],
      yande: [],
      konachan: [],
      rule34paheal: [],
      xbooru: [],
      reddit: [],
    },
  },
  credentials: {
    rule34: { userId: '', apiKey: '' },
    gelbooru: { userId: '', apiKey: '' },
    danbooru: { username: '', apiKey: '' },
    e621: { username: '', apiKey: '' },
  },
  preferences: {
    defaultVolume: 1,
    mutedByDefault: true,
    fitMode: 'contain',
    activeSources: ['rule34', 'e621', 'danbooru'],
    ratingFilter: 'all',
    favoriteSaltingPattern: 'jitter',
    port: 8765,
  },
};

export const nativeStorage = {
  getSettings(): AppSettings {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
      }
    } catch (e) {}
    return DEFAULT_SETTINGS;
  },

  saveSettings(settings: AppSettings): AppSettings {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    return settings;
  },

  getFavorites(): FeedItem[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FAVORITES);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {}
    return [];
  },

  saveFavorites(favorites: FeedItem[]): void {
    localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(favorites));
  },

  toggleFavorite(item: FeedItem): { isFavorited: boolean; total: number } {
    const list = this.getFavorites();
    const existingIndex = list.findIndex(f => f.id === item.id);
    let isFavorited = false;

    if (existingIndex >= 0) {
      list.splice(existingIndex, 1);
      isFavorited = false;
    } else {
      list.unshift(item);
      isFavorited = true;
    }

    this.saveFavorites(list);
    return { isFavorited, total: list.length };
  },

  exportBackup(): any {
    return {
      version: '1.0',
      timestamp: new Date().toISOString(),
      settings: this.getSettings(),
      favorites: this.getFavorites(),
    };
  },

  importBackup(backupData: any): void {
    if (backupData.settings) {
      this.saveSettings(backupData.settings);
    }
    if (Array.isArray(backupData.favorites)) {
      this.saveFavorites(backupData.favorites);
    }
  },
};
