import { XMLParser } from 'fast-xml-parser';
import { buildQueryTags, detectMediaType, normalizeRating, filterOutBlacklisted } from './types.js';

export async function fetchRule34Paheal({ tags = '', page = 0, limit = 40, blacklist = [] }) {
  const queryTags = buildQueryTags(tags, blacklist);
  const url = `https://rule34.paheal.net/api/danbooru/find_posts?tags=${encodeURIComponent(queryTags)}&limit=${limit}&offset=${page * limit}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!response.ok) {
    if (response.status === 404) return [];
    throw new Error(`Paheal API error: ${response.status}`);
  }

  const xmlText = await response.text();
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
  const parsed = parser.parse(xmlText);

  let rawPosts = parsed.posts?.tag || [];
  if (!Array.isArray(rawPosts)) {
    rawPosts = rawPosts ? [rawPosts] : [];
  }

  const items = rawPosts.map(post => {
    const rawTags = (post.tags || '').trim().split(/\s+/).filter(Boolean);
    const mediaUrl = post.file_url;
    const previewUrl = post.preview_url || mediaUrl;
    const type = detectMediaType(mediaUrl);

    return {
      id: `paheal_${post.id}`,
      sourceId: 'rule34paheal',
      sourceName: 'Rule34 Paheal',
      sourceUrl: `https://rule34.paheal.net/post/view/${post.id}`,
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
