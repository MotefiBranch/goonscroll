import { detectMediaType, normalizeRating, filterOutBlacklisted } from './types.js';

export async function fetchKonachan({ tags = '', page = 1, limit = 40, blacklist = [] }) {
  // Use konachan.com (adult domain) and filter blacklist locally to avoid Moebooru tag count limit
  const queryTags = (tags || '').trim();
  const url = `https://konachan.com/post.json?tags=${encodeURIComponent(queryTags)}&page=${page}&limit=${limit}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!response.ok) throw new Error(`Konachan HTTP ${response.status}: ${response.statusText || 'Failed'}`);
  const data = await response.json().catch(() => []);
  if (!Array.isArray(data)) return [];

  const items = data.map(post => {
    const rawTags = (post.tags || '').trim().split(/\s+/).filter(Boolean);
    const mediaUrl = post.file_url || post.jpeg_url || post.sample_url;
    const previewUrl = post.preview_url || post.sample_url || mediaUrl;
    const type = detectMediaType(mediaUrl);

    return {
      id: `konachan_${post.id}`,
      sourceId: 'konachan',
      sourceName: 'Konachan',
      sourceUrl: `https://konachan.com/post/show/${post.id}`,
      type,
      mediaUrl,
      previewUrl,
      tags: {
        all: rawTags,
        general: rawTags,
        artist: [],
        character: [],
        copyright: [],
      },
      score: post.score || 0,
      rating: normalizeRating(post.rating),
      width: post.width,
      height: post.height,
      author: post.author,
    };
  });

  return filterOutBlacklisted(items, blacklist);
}

export async function autocompleteKonachan(query = '') {
  if (!query || query.length < 2) return [];
  const url = `https://konachan.com/tag.json?name=${encodeURIComponent(query)}&limit=10`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map(t => t.name).filter(Boolean);
    }
  } catch (err) {}
  return [];
}
