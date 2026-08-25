import { buildQueryTags, detectMediaType, normalizeRating, filterOutBlacklisted } from './types.js';

export async function fetchRealbooru({ tags = '', page = 0, limit = 40, blacklist = [] }) {
  const queryTags = buildQueryTags(tags, blacklist);
  const encodedTags = encodeURIComponent(queryTags);
  const url = `https://realbooru.com/index.php?page=dapi&s=post&q=index&json=1&tags=${encodedTags}&pid=${page}&limit=${limit}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
  });

  if (!response.ok) {
    if (response.status === 404) return [];
    throw new Error(`Realbooru API error: ${response.status}`);
  }

  const data = await response.json();
  const posts = Array.isArray(data) ? data : [];

  const items = posts.map(post => {
    const rawTags = (post.tags || '').trim().split(/\s+/).filter(Boolean);
    // Realbooru uses images/directory/image.jpg structure
    const mediaUrl = post.file_url || `https://realbooru.com/images/${post.directory}/${post.image}`;
    const previewUrl = post.preview_url || `https://realbooru.com/thumbnails/${post.directory}/thumbnail_${post.image}`;
    const type = detectMediaType(mediaUrl);

    return {
      id: `realbooru_${post.id}`,
      sourceId: 'realbooru',
      sourceName: 'RealBooru',
      sourceUrl: `https://realbooru.com/index.php?page=post&s=view&id=${post.id}`,
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
