import { FeedItem, SourceOption, AppSettings } from '../types/feed';
import { nativeStorage } from '../services/nativeStorage';
import { nativePushToGitHub, nativePullFromGitHub } from '../services/nativeSync';
import { getNativeFeed } from '../services/nativeBooruEngine';
// @ts-ignore
import { getFeed, getAutocomplete } from '../../server/adapters/index.js';

const API_BASE = '/api';

export async function fetchSources(): Promise<SourceOption[]> {
  try {
    const res = await fetch(`${API_BASE}/sources`);
    if (res.ok) {
      const data = await res.json();
      return data.sources || [];
    }
  } catch (e) {}

  // Fallback source list
  return [
    { id: 'rule34', name: 'Rule34', icon: '🔞', supportsAutocomplete: true },
    { id: 'e621', name: 'e621', icon: '🐾', supportsAutocomplete: true },
    { id: 'danbooru', name: 'Danbooru', icon: '🎨', supportsAutocomplete: true },
    { id: 'yande', name: 'Yande.re', icon: '🌸', supportsAutocomplete: true },
    { id: 'konachan', name: 'Konachan', icon: '⛩️', supportsAutocomplete: true },
    { id: 'rule34paheal', name: 'Rule34 Paheal', icon: '🎭', supportsAutocomplete: true },
    { id: 'xbooru', name: 'Xbooru', icon: '⚡', supportsAutocomplete: true },
    { id: 'gelbooru', name: 'Gelbooru', icon: '💎', supportsAutocomplete: true },
    { id: 'realbooru', name: 'Realbooru', icon: '📷', supportsAutocomplete: true },
    { id: 'reddit', name: 'Reddit', icon: '🤖', supportsAutocomplete: true },
  ];
}

export async function fetchFeed(params: {
  source: string;
  tags?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: FeedItem[]; page: number; count: number }> {
  // 1. Try server endpoint if backend is live
  try {
    const query = new URLSearchParams();
    query.set('source', params.source);
    if (params.tags) query.set('tags', params.tags);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    const res = await fetch(`${API_BASE}/feed?${query.toString()}`);
    if (res.ok) {
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        return data;
      }
    }
  } catch (e) {}

  // 2. Standalone Client-Side Booru Engine (for native iOS app execution)
  try {
    const settings = await fetchSettings();
    const globalBlacklist = settings.blacklist?.global || [];
    const sourceBlacklist = settings.blacklist?.bySource?.[params.source] || [];
    const effectiveBlacklist = Array.from(new Set([...globalBlacklist, ...sourceBlacklist]));

    let rawItems = await getNativeFeed({
      source: params.source,
      tags: params.tags || '',
      page: params.page || 1,
      limit: params.limit || 40,
      blacklist: effectiveBlacklist,
      credentials: settings.credentials || {},
    });

    if ((!rawItems || rawItems.length === 0) && typeof getFeed === 'function') {
      try {
        rawItems = await getFeed({
          source: params.source,
          tags: params.tags || '',
          page: params.page || 1,
          limit: params.limit || 40,
          blacklist: effectiveBlacklist,
          credentials: settings.credentials || {},
        });
      } catch (e) {}
    }

    return {
      items: (rawItems || []) as FeedItem[],
      page: params.page || 1,
      count: (rawItems || []).length,
    };
  } catch (err: any) {
    console.error('Client-side booru fetch error:', err);
    return { items: [], page: params.page || 1, count: 0 };
  }
}

export async function fetchAutocomplete(source: string, query: string): Promise<string[]> {
  if (!query || query.length < 2) return [];
  try {
    const params = new URLSearchParams({ source, query });
    const res = await fetch(`${API_BASE}/autocomplete?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      return data.suggestions || [];
    }
  } catch (e) {}

  try {
    return await getAutocomplete({ source, query });
  } catch (e) {}
  return [];
}

export async function fetchSettings(): Promise<AppSettings> {
  try {
    const res = await fetch(`${API_BASE}/settings`);
    if (res.ok) return res.json();
  } catch (e) {}
  return nativeStorage.getSettings();
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  try {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
    if (res.ok) return res.json();
  } catch (e) {}
  const current = nativeStorage.getSettings();
  const merged: AppSettings = {
    ...current,
    ...settings,
    blacklist: { ...current.blacklist, ...(settings.blacklist || {}) },
    favoriteTags: { ...current.favoriteTags, ...(settings.favoriteTags || {}) },
    credentials: { ...current.credentials, ...(settings.credentials || {}) },
    preferences: { ...current.preferences, ...(settings.preferences || {}) },
  };
  return nativeStorage.saveSettings(merged);
}

export async function addBlacklistTag(tag: string, source: string = 'global'): Promise<AppSettings['blacklist']> {
  try {
    const res = await fetch(`${API_BASE}/blacklist/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag, source }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.blacklist;
    }
  } catch (e) {}
  const settings = nativeStorage.getSettings();
  if (source === 'global') {
    if (!settings.blacklist.global.includes(tag)) {
      settings.blacklist.global.push(tag);
    }
  } else {
    settings.blacklist.bySource[source] = settings.blacklist.bySource[source] || [];
    if (!settings.blacklist.bySource[source].includes(tag)) {
      settings.blacklist.bySource[source].push(tag);
    }
  }
  nativeStorage.saveSettings(settings);
  return settings.blacklist;
}

export async function removeBlacklistTag(tag: string, source: string = 'global'): Promise<AppSettings['blacklist']> {
  try {
    const res = await fetch(`${API_BASE}/blacklist/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag, source }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.blacklist;
    }
  } catch (e) {}
  const settings = nativeStorage.getSettings();
  if (source === 'global') {
    settings.blacklist.global = settings.blacklist.global.filter(t => t !== tag);
  } else if (settings.blacklist.bySource[source]) {
    settings.blacklist.bySource[source] = settings.blacklist.bySource[source].filter(t => t !== tag);
  }
  nativeStorage.saveSettings(settings);
  return settings.blacklist;
}

export async function addFavoriteTag(tag: string, source: string = 'global'): Promise<AppSettings['favoriteTags']> {
  try {
    const res = await fetch(`${API_BASE}/favorites/tags/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag, source }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.favoriteTags;
    }
  } catch (e) {}
  const settings = nativeStorage.getSettings();
  if (source === 'global') {
    if (!settings.favoriteTags.global.includes(tag)) {
      settings.favoriteTags.global.push(tag);
    }
  } else {
    settings.favoriteTags.bySource[source] = settings.favoriteTags.bySource[source] || [];
    if (!settings.favoriteTags.bySource[source].includes(tag)) {
      settings.favoriteTags.bySource[source].push(tag);
    }
  }
  nativeStorage.saveSettings(settings);
  return settings.favoriteTags;
}

export async function removeFavoriteTag(tag: string, source: string = 'global'): Promise<AppSettings['favoriteTags']> {
  try {
    const res = await fetch(`${API_BASE}/favorites/tags/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag, source }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.favoriteTags;
    }
  } catch (e) {}
  const settings = nativeStorage.getSettings();
  if (source === 'global') {
    settings.favoriteTags.global = settings.favoriteTags.global.filter(t => t !== tag);
  } else if (settings.favoriteTags.bySource[source]) {
    settings.favoriteTags.bySource[source] = settings.favoriteTags.bySource[source].filter(t => t !== tag);
  }
  nativeStorage.saveSettings(settings);
  return settings.favoriteTags;
}

export async function fetchFavorites(): Promise<FeedItem[]> {
  try {
    const res = await fetch(`${API_BASE}/favorites`);
    if (res.ok) {
      const data = await res.json();
      return data.favorites || [];
    }
  } catch (e) {}
  return nativeStorage.getFavorites();
}

export async function toggleFavoriteApi(item: FeedItem): Promise<{ isFavorited: boolean; total: number }> {
  try {
    const res = await fetch(`${API_BASE}/favorites/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item }),
    });
    if (res.ok) return res.json();
  } catch (e) {}
  return nativeStorage.toggleFavorite(item);
}

export async function exportBackupJson(): Promise<void> {
  const data = nativeStorage.exportBackup();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `goonscroll_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importBackupJson(backupData: any): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/backup/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(backupData),
    });
    if (res.ok) return res.json();
  } catch (e) {}
  nativeStorage.importBackup(backupData);
  return { success: true, message: 'Settings & favorites imported' };
}

export async function getGitHubSyncStatus(): Promise<{ configured: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/backup/github/status`);
    if (res.ok) return res.json();
  } catch (e) {}
  return { configured: false };
}

export async function syncToGitHubGist(token?: string): Promise<{ success: boolean; gistId: string; updatedAt: string; url: string }> {
  try {
    const res = await fetch(`${API_BASE}/backup/github/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (res.ok) return res.json();
  } catch (e) {}

  if (!token) throw new Error('GitHub token required');
  const result = await nativePushToGitHub(token);
  return { success: true, gistId: 'repository', updatedAt: result.updatedAt, url: 'https://github.com/lalaliwe/goonscroll' };
}

export async function pullFromGitHubGist(token?: string): Promise<{ success: boolean; result: any; updatedAt: string }> {
  try {
    const res = await fetch(`${API_BASE}/backup/github/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (res.ok) return res.json();
  } catch (e) {}

  if (!token) throw new Error('GitHub token required');
  return nativePullFromGitHub(token);
}

export function getProxiedMediaUrl(url: string, nonce?: number): string {
  if (!url) return '';
  // In native Capacitor iOS mode, media loads directly via native iOS network stack!
  const isNative = typeof window !== 'undefined' && (window.location.protocol === 'ionic:' || window.location.protocol === 'capacitor:');
  if (isNative) {
    return nonce ? `${url}&_t=${nonce}` : url;
  }

  if (url.startsWith('/api/proxy')) {
    return nonce ? `${url}&_t=${nonce}` : url;
  }
  const base = `${API_BASE}/proxy/media?url=${encodeURIComponent(url)}`;
  return nonce ? `${base}&_t=${nonce}` : base;
}
