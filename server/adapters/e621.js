import { buildQueryTags, detectMediaType, normalizeRating, filterOutBlacklisted } from './types.js';

export async function fetchE621({ tags = '', page = 1, limit = 40, blacklist = [], credentials = {} }) {
  const queryTags = buildQueryTags(tags, blacklist);
  const encodedTags = encodeURIComponent(queryTags);
  const url = `https://e621.net/posts.json?tags=${encodedTags}&page=${page}&limit=${limit}`;

  const headers = {
    'User-Agent': 'GoonScroll/1.0 (by Duck on Android/Termux; contact duck@goonscroll.local)',
  };

  if (credentials.username && credentials.apiKey) {
    const authString = Buffer.from(`${credentials.username}:${credentials.apiKey}`).toString('base64');
    headers['Authorization'] = `Basic ${authString}`;
  }

  const response = await fetch(url, { headers });

  if (!response.ok) {
    if (response.status === 404) return [];
    throw new Error(`e621 API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const posts = data.posts || [];
  if (!Array.isArray(posts)) return [];

  const items = posts
    .filter(post => post.file && post.file.url)
    .map(post => {
      const mediaUrl = post.file.url;
      const previewUrl = post.preview?.url || post.sample?.url || mediaUrl;
      const type = detectMediaType(mediaUrl);

      const generalTags = post.tags?.general || [];
      const artistTags = post.tags?.artist || [];
      const characterTags = post.tags?.character || [];
      const copyrightTags = post.tags?.copyright || [];
      const metaTags = post.tags?.meta || [];
      const allTags = [
        ...generalTags,
        ...artistTags,
        ...characterTags,
        ...copyrightTags,
        ...metaTags,
      ];

      return {
        id: `e621_${post.id}`,
        sourceId: 'e621',
        sourceName: 'e621',
        sourceUrl: `https://e621.net/posts/${post.id}`,
        type,
        mediaUrl,
        previewUrl,
        tags: {
          all: allTags,
          general: generalTags,
          artist: artistTags,
          character: characterTags,
          copyright: copyrightTags,
          meta: metaTags,
        },
        score: post.score?.total || 0,
        rating: normalizeRating(post.rating),
        width: post.file?.width || 0,
        height: post.file?.height || 0,
        aspectRatio: post.file?.width && post.file?.height ? post.file.width / post.file.height : undefined,
        author: artistTags.length > 0 ? artistTags[0] : undefined,
      };
    });

  return filterOutBlacklisted(items, blacklist);
}

export async function autocompleteE621(query = '') {
  if (!query || query.length < 2) return [];
  const url = `https://e621.net/tags/autocomplete.json?search[name_matches]=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'GoonScroll/1.0 (by Duck on Termux)',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map(item => item.name).filter(Boolean);
    }
  } catch (err) {
    console.error('e621 autocomplete error:', err);
  }
  return [];
}
