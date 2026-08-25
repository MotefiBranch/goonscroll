import { buildQueryTags, detectMediaType, normalizeRating, filterOutBlacklisted } from './types.js';

export async function fetchGelbooru({ tags = '', page = 0, limit = 40, blacklist = [] }) {
  const queryTags = buildQueryTags(tags, blacklist);
  const encodedTags = encodeURIComponent(queryTags);
  const url = `https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&tags=${encodedTags}&pid=${page}&limit=${limit}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!response.ok) {
    if (response.status === 404) return [];
    throw new Error(`Gelbooru API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const posts = data.post || data.posts || data;
  if (!Array.isArray(posts)) return [];

  const items = posts.map(post => {
    const rawTags = (post.tags || '').trim().split(/\s+/).filter(Boolean);
    const mediaUrl = post.file_url;
    const previewUrl = post.preview_url || mediaUrl;
    const type = detectMediaType(mediaUrl);

    return {
      id: `gelbooru_${post.id}`,
      sourceId: 'gelbooru',
      sourceName: 'Gelbooru',
      sourceUrl: `https://gelbooru.com/index.php?page=post&s=view&id=${post.id}`,
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
      score: parseInt(post.score || '0', 10),
      rating: normalizeRating(post.rating),
      width: parseInt(post.width || '0', 10),
      height: parseInt(post.height || '0', 10),
      aspectRatio: post.width && post.height ? post.width / post.height : undefined,
    };
  });

  return filterOutBlacklisted(items, blacklist);
}

export async function autocompleteGelbooru(query = '') {
  if (!query || query.length < 2) return [];
  const url = `https://gelbooru.com/index.php?page=dapi&s=tag&q=index&json=1&name_pattern=${encodeURIComponent(query)}%25&limit=10`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const tags = data.tag || [];
    if (Array.isArray(tags)) {
      return tags.map(t => t.name).filter(Boolean);
    }
  } catch (err) {
    console.error('Gelbooru autocomplete error:', err);
  }
  return [];
}
