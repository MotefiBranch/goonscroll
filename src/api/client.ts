import { FeedItem, SourceOption, AppSettings } from '../types/feed';

const API_BASE = '/api';

export async function fetchSources(): Promise<SourceOption[]> {
  const res = await fetch(`${API_BASE}/sources`);
  if (!res.ok) throw new Error('Failed to fetch sources');
  const data = await res.json();
  return data.sources || [];
}

export async function fetchFeed(params: {
  source: string;
  tags?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: FeedItem[]; page: number; count: number }> {
  const query = new URLSearchParams();
  query.set('source', params.source);
  if (params.tags) query.set('tags', params.tags);
  if (params.page) query.set('page', params.page.toString());
  if (params.limit) query.set('limit', params.limit.toString());

  const res = await fetch(`${API_BASE}/feed?${query.toString()}`);
  if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchAutocomplete(source: string, query: string): Promise<string[]> {
  if (!query || query.length < 2) return [];
  const params = new URLSearchParams({ source, query });
  const res = await fetch(`${API_BASE}/autocomplete?${params.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.suggestions || [];
}

export async function fetchSettings(): Promise<AppSettings> {
  const res = await fetch(`${API_BASE}/settings`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const res = await fetch(`${API_BASE}/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}

export async function addBlacklistTag(tag: string, source: string = 'global'): Promise<AppSettings['blacklist']> {
  const res = await fetch(`${API_BASE}/blacklist/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag, source }),
  });
  if (!res.ok) throw new Error('Failed to add blacklist tag');
  const data = await res.json();
  return data.blacklist;
}

export async function removeBlacklistTag(tag: string, source: string = 'global'): Promise<AppSettings['blacklist']> {
  const res = await fetch(`${API_BASE}/blacklist/remove`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag, source }),
  });
  if (!res.ok) throw new Error('Failed to remove blacklist tag');
  const data = await res.json();
  return data.blacklist;
}

export async function addFavoriteTag(tag: string, source: string = 'global'): Promise<AppSettings['favoriteTags']> {
  const res = await fetch(`${API_BASE}/favorites/tags/add`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag, source }),
  });
  if (!res.ok) throw new Error('Failed to add favorite tag');
  const data = await res.json();
  return data.favoriteTags;
}

export async function removeFavoriteTag(tag: string, source: string = 'global'): Promise<AppSettings['favoriteTags']> {
  const res = await fetch(`${API_BASE}/favorites/tags/remove`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag, source }),
  });
  if (!res.ok) throw new Error('Failed to remove favorite tag');
  const data = await res.json();
  return data.favoriteTags;
}

export async function fetchFavorites(): Promise<FeedItem[]> {
  const res = await fetch(`${API_BASE}/favorites`);
  if (!res.ok) throw new Error('Failed to fetch favorites');
  const data = await res.json();
  return data.favorites || [];
}

export async function toggleFavoriteApi(item: FeedItem): Promise<{ isFavorited: boolean; total: number }> {
  const res = await fetch(`${API_BASE}/favorites/toggle`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ item }),
  });
  if (!res.ok) throw new Error('Failed to toggle favorite');
  return res.json();
}

export async function exportBackupJson(): Promise<void> {
  window.open(`${API_BASE}/backup/export`, '_blank');
}

export async function importBackupJson(backupData: any): Promise<any> {
  const res = await fetch(`${API_BASE}/backup/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(backupData),
  });
  if (!res.ok) throw new Error('Failed to import backup');
  return res.json();
}

export async function getGitHubSyncStatus(): Promise<{ configured: boolean }> {
  const res = await fetch(`${API_BASE}/backup/github/status`);
  if (!res.ok) return { configured: false };
  return res.json();
}

export async function syncToGitHubGist(token?: string): Promise<{ success: boolean; gistId: string; updatedAt: string; url: string }> {
  const res = await fetch(`${API_BASE}/backup/github/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to sync to GitHub');
  return data;
}

export async function pullFromGitHubGist(token?: string): Promise<{ success: boolean; result: any; updatedAt: string }> {
  const res = await fetch(`${API_BASE}/backup/github/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to pull from GitHub');
  return data;
}

export function getProxiedMediaUrl(url: string): string {
  if (!url) return '';
  // If already proxied or relative
  if (url.startsWith('/api/proxy')) return url;
  return `${API_BASE}/proxy/media?url=${encodeURIComponent(url)}`;
}
