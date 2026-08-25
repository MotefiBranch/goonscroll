import { buildQueryTags, detectMediaType, normalizeRating, filterOutBlacklisted } from './types.js';

export async function fetchYande({ tags = '', page = 1, limit = 40, blacklist = [] }) {
  const queryTags = buildQueryTags(tags, blacklist);
  const url = `https://yande.re/post.json?tags=${encodeURIComponent(queryTags)}&page=${page}&limit=${limit}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GoonScroll/1.0',
    },
  });

  if (!response.ok) return [];
  const data = await response.json();
  if (!Array.isArray(data)) return [];

  const items = data.map(post => {
    const rawTags = (post.tags || '').trim().split(/\s+/).filter(Boolean);
    const mediaUrl = post.file_url || post.jpeg_url || post.sample_url;
    const previewUrl = post.preview_url || post.sample_url || mediaUrl;
    const type = detectMediaType(mediaUrl);

    return {
      id: `yande_${post.id}`,
      sourceId: 'yande',
      sourceName: 'Yande.re',
      sourceUrl: `https://yande.re/post/show/${post.id}`,
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

export async function autocompleteYande(query = '') {
  if (!query || query.length < 2) return [];
  const url = `https://yande.re/tag.json?name=${encodeURIComponent(query)}&limit=10`;
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
