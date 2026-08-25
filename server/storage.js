import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const getDataDir = () => process.env.DATA_DIR || path.join(__dirname, '..', 'data');
const getSettingsFile = () => path.join(getDataDir(), 'settings.json');
const getFavoritesFile = () => path.join(getDataDir(), 'favorites.json');

const DEFAULT_SETTINGS = {
  blacklist: {
    global: [],
    bySource: {
      rule34: [],
      e621: [],
      danbooru: [],
      yande: [],
      konachan: [],
      rule34paheal: [],
      xbooru: [],
      reddit: []
    }
  },
  favoriteTags: {
    global: [],
    bySource: {
      rule34: [],
      e621: [],
      danbooru: [],
      yande: [],
      konachan: [],
      rule34paheal: [],
      xbooru: [],
      reddit: []
    }
  },
  credentials: {
    rule34: { userId: '', apiKey: '' },
    gelbooru: { userId: '', apiKey: '' },
    danbooru: { username: '', apiKey: '' },
    e621: { username: '', apiKey: '' }
  },
  preferences: {
    defaultVolume: 0.8,
    mutedByDefault: true,
    fitMode: 'contain',
    activeSources: ['rule34', 'e621', 'danbooru', 'yande', 'konachan', 'rule34paheal', 'xbooru'],
    ratingFilter: 'all',
    favoriteSaltingPattern: 'jitter', // 'jitter' | '1in3' | '1in5' | 'off'
    port: 8765
  }
};

const DEFAULT_FAVORITES = {
  posts: []
};

// Deep clone utility
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Atomic file write using temporary file replacement
function atomicWriteFileSync(filePath, data) {
  const tempPath = `${filePath}.${Date.now()}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
  fs.renameSync(tempPath, filePath);
}

class StorageEngine {
  constructor() {
    this.ensureDirectory();
    this.settings = this.loadSettings();
    this.favorites = this.loadFavorites();
  }

  ensureDirectory() {
    if (!fs.existsSync(getDataDir())) {
      fs.mkdirSync(getDataDir(), { recursive: true });
    }
  }

  loadSettings() {
    try {
      if (fs.existsSync(getSettingsFile())) {
        const raw = fs.readFileSync(getSettingsFile(), 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_SETTINGS,
          ...parsed,
          blacklist: {
            global: parsed.blacklist?.global || [],
            bySource: {
              ...DEFAULT_SETTINGS.blacklist.bySource,
              ...(parsed.blacklist?.bySource || {})
            }
          },
          favoriteTags: {
            global: parsed.favoriteTags?.global || [],
            bySource: {
              ...DEFAULT_SETTINGS.favoriteTags.bySource,
              ...(parsed.favoriteTags?.bySource || {})
            }
          },
          credentials: {
            ...DEFAULT_SETTINGS.credentials,
            ...(parsed.credentials || {})
          },
          preferences: {
            ...DEFAULT_SETTINGS.preferences,
            ...(parsed.preferences || {})
          }
        };
      }
    } catch (err) {
      console.error('Error reading settings file, resetting to defaults:', err);
    }
    const initial = deepClone(DEFAULT_SETTINGS);
    this.saveSettings(initial);
    return initial;
  }

  saveSettings(newSettings) {
    this.ensureDirectory();
    this.settings = deepClone(newSettings);
    atomicWriteFileSync(getSettingsFile(), this.settings);
  }

  getSettings() {
    return deepClone(this.settings);
  }

  updateSettings(updates) {
    if (updates.preferences) {
      this.settings.preferences = {
        ...this.settings.preferences,
        ...updates.preferences
      };
    }
    if (updates.credentials) {
      this.settings.credentials = {
        ...this.settings.credentials,
        ...updates.credentials
      };
    }
    if (updates.blacklist) {
      this.settings.blacklist = {
        ...this.settings.blacklist,
        ...updates.blacklist
      };
    }
    if (updates.favoriteTags) {
      this.settings.favoriteTags = {
        ...this.settings.favoriteTags,
        ...updates.favoriteTags
      };
    }
    this.saveSettings(this.settings);
    return deepClone(this.settings);
  }

  updatePreferences(prefs) {
    this.settings.preferences = {
      ...this.settings.preferences,
      ...prefs
    };
    this.saveSettings(this.settings);
    return deepClone(this.settings);
  }

  updateCredentials(creds) {
    this.settings.credentials = {
      ...this.settings.credentials,
      ...creds
    };
    this.saveSettings(this.settings);
    return deepClone(this.settings);
  }

  /* --- Blacklist Operations --- */

  getEffectiveBlacklist(source) {
    const globalList = this.settings.blacklist.global || [];
    const sourceList = (source && this.settings.blacklist.bySource[source]) || [];
    return Array.from(new Set([...globalList, ...sourceList]));
  }

  addBlacklistTag(tag, scope = 'global') {
    const cleanTag = tag.trim().toLowerCase();
    if (!cleanTag) return this.getSettings();

    if (scope === 'global') {
      if (!this.settings.blacklist.global.includes(cleanTag)) {
        this.settings.blacklist.global.push(cleanTag);
      }
    } else {
      if (!this.settings.blacklist.bySource[scope]) {
        this.settings.blacklist.bySource[scope] = [];
      }
      if (!this.settings.blacklist.bySource[scope].includes(cleanTag)) {
        this.settings.blacklist.bySource[scope].push(cleanTag);
      }
    }

    this.saveSettings(this.settings);
    return this.getSettings();
  }

  removeBlacklistTag(tag, scope = 'global') {
    const cleanTag = tag.trim().toLowerCase();
    if (!cleanTag) return this.getSettings();

    if (scope === 'global') {
      this.settings.blacklist.global = this.settings.blacklist.global.filter(t => t !== cleanTag);
    } else if (this.settings.blacklist.bySource[scope]) {
      this.settings.blacklist.bySource[scope] = this.settings.blacklist.bySource[scope].filter(t => t !== cleanTag);
    }

    this.saveSettings(this.settings);
    return this.getSettings();
  }

  /* --- Favorite Tags Operations --- */

  getEffectiveFavoriteTags(source) {
    const globalList = this.settings.favoriteTags?.global || [];
    const sourceList = (source && this.settings.favoriteTags?.bySource?.[source]) || [];
    return Array.from(new Set([...globalList, ...sourceList]));
  }

  addFavoriteTag(tag, scope = 'global') {
    const cleanTag = tag.trim().toLowerCase();
    if (!cleanTag) return this.getSettings();

    if (!this.settings.favoriteTags) {
      this.settings.favoriteTags = deepClone(DEFAULT_SETTINGS.favoriteTags);
    }

    if (scope === 'global') {
      if (!this.settings.favoriteTags.global.includes(cleanTag)) {
        this.settings.favoriteTags.global.push(cleanTag);
      }
    } else {
      if (!this.settings.favoriteTags.bySource[scope]) {
        this.settings.favoriteTags.bySource[scope] = [];
      }
      if (!this.settings.favoriteTags.bySource[scope].includes(cleanTag)) {
        this.settings.favoriteTags.bySource[scope].push(cleanTag);
      }
    }

    this.saveSettings(this.settings);
    return this.getSettings();
  }

  removeFavoriteTag(tag, scope = 'global') {
    const cleanTag = tag.trim().toLowerCase();
    if (!cleanTag) return this.getSettings();

    if (!this.settings.favoriteTags) return this.getSettings();

    if (scope === 'global') {
      this.settings.favoriteTags.global = this.settings.favoriteTags.global.filter(t => t !== cleanTag);
    } else if (this.settings.favoriteTags.bySource[scope]) {
      this.settings.favoriteTags.bySource[scope] = this.settings.favoriteTags.bySource[scope].filter(t => t !== cleanTag);
    }

    this.saveSettings(this.settings);
    return this.getSettings();
  }

  /* --- Favorite Posts Operations --- */

  loadFavorites() {
    try {
      if (fs.existsSync(getFavoritesFile())) {
        const raw = fs.readFileSync(getFavoritesFile(), 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return { posts: parsed };
        }
        if (parsed && Array.isArray(parsed.posts)) {
          return parsed;
        }
      }
    } catch (err) {
      console.error('Error reading favorites file:', err);
    }
    const initial = deepClone(DEFAULT_FAVORITES);
    this.saveFavorites(initial);
    return initial;
  }

  saveFavorites(newFavorites) {
    this.ensureDirectory();
    if (Array.isArray(newFavorites)) {
      this.favorites = { posts: deepClone(newFavorites) };
    } else {
      this.favorites = deepClone(newFavorites);
    }
    atomicWriteFileSync(getFavoritesFile(), this.favorites);
  }

  getFavorites() {
    if (!this.favorites) return [];
    if (Array.isArray(this.favorites)) return deepClone(this.favorites);
    return deepClone(this.favorites.posts || []);
  }

  toggleFavorite(item) {
    if (!this.favorites || !Array.isArray(this.favorites.posts)) {
      this.favorites = { posts: Array.isArray(this.favorites) ? this.favorites : [] };
    }

    const existingIndex = this.favorites.posts.findIndex(p => p.id === item.id);
    let isFavorited = false;

    if (existingIndex >= 0) {
      this.favorites.posts.splice(existingIndex, 1);
      isFavorited = false;
    } else {
      this.favorites.posts.unshift({
        ...item,
        savedAt: new Date().toISOString()
      });
      isFavorited = true;
    }

    this.saveFavorites(this.favorites);
    return { isFavorited, total: this.favorites.posts.length };
  }

  isFavorited(itemId) {
    const list = this.getFavorites();
    return list.some(p => p.id === itemId);
  }

  /* --- Backup Import / Export --- */

  exportBackup() {
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      favorites: this.getFavorites()
    };
  }

  importBackup(backupData) {
    if (!backupData || typeof backupData !== 'object') {
      throw new Error('Invalid backup data format');
    }

    if (backupData.settings) {
      this.saveSettings({
        ...DEFAULT_SETTINGS,
        ...backupData.settings
      });
    }

    if (Array.isArray(backupData.favorites)) {
      this.saveFavorites({ posts: backupData.favorites });
    }

    return {
      settings: this.getSettings(),
      favorites: this.getFavorites()
    };
  }

  /* --- GitHub Gist Cloud Sync --- */

  async syncToGitHub(customToken = null) {
    const token = customToken || process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('No GitHub Token configured in .env');
    }

    const backupData = this.exportBackup();
    const backupJsonString = JSON.stringify(backupData, null, 2);

    const listRes = await fetch('https://api.github.com/gists', {
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'GoonScroll-Sync',
        'Accept': 'application/vnd.github.v3+json',
      }
    });

    if (!listRes.ok) {
      const errBody = await listRes.json().catch(() => ({}));
      throw new Error(errBody.message || `GitHub API error: ${listRes.status}`);
    }

    const gists = await listRes.json();
    const existingGist = gists.find(g => g.files && g.files['goonscroll_backup.json']);

    let resultGist;
    if (existingGist) {
      const updateRes = await fetch(`https://api.github.com/gists/${existingGist.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${token}`,
          'User-Agent': 'GoonScroll-Sync',
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          description: 'GoonScroll Private Cloud Backup',
          files: {
            'goonscroll_backup.json': {
              content: backupJsonString,
            }
          }
        })
      });
      if (!updateRes.ok) throw new Error(`Failed to update Gist: ${updateRes.status}`);
      resultGist = await updateRes.json();
    } else {
      const createRes = await fetch('https://api.github.com/gists', {
        method: 'POST',
        headers: {
          'Authorization': `token ${token}`,
          'User-Agent': 'GoonScroll-Sync',
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          description: 'GoonScroll Private Cloud Backup',
          public: false,
          files: {
            'goonscroll_backup.json': {
              content: backupJsonString,
            }
          }
        })
      });
      if (!createRes.ok) throw new Error(`Failed to create Gist: ${createRes.status}`);
      resultGist = await createRes.json();
    }

    return {
      success: true,
      gistId: resultGist.id,
      updatedAt: resultGist.updated_at,
      url: resultGist.html_url,
    };
  }

  async pullFromGitHub(customToken = null) {
    const token = customToken || process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error('No GitHub Token configured in .env');
    }

    const listRes = await fetch('https://api.github.com/gists', {
      headers: {
        'Authorization': `token ${token}`,
        'User-Agent': 'GoonScroll-Sync',
        'Accept': 'application/vnd.github.v3+json',
      }
    });

    if (!listRes.ok) {
      const errBody = await listRes.json().catch(() => ({}));
      throw new Error(errBody.message || `GitHub API error: ${listRes.status}`);
    }

    const gists = await listRes.json();
    const existingGist = gists.find(g => g.files && g.files['goonscroll_backup.json']);
    if (!existingGist) {
      throw new Error('No GoonScroll backup Gist found in your GitHub account');
    }

    const fileMeta = existingGist.files['goonscroll_backup.json'];
    let content = fileMeta.content;
    if (!content && fileMeta.raw_url) {
      const rawRes = await fetch(fileMeta.raw_url, {
        headers: {
          'Authorization': `token ${token}`,
          'User-Agent': 'GoonScroll-Sync',
        }
      });
      content = await rawRes.text();
    }

    const parsedBackup = JSON.parse(content);
    const imported = this.importBackup(parsedBackup);

    return {
      success: true,
      result: imported,
      gistId: existingGist.id,
      updatedAt: existingGist.updated_at,
    };
  }
}

export const storage = new StorageEngine();
export default storage;
