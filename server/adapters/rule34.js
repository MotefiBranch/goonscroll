import { detectMediaType, normalizeRating, filterOutBlacklisted } from './types.js';

export async function fetchRule34({ tags = '', page = 0, limit = 42, blacklist = [], credentials = {} }) {
  // 1. If user has Rule34 API credentials configured, use official JSON API
  if (credentials.userId && credentials.apiKey) {
    const encodedTags = encodeURIComponent(tags.trim());
    const apiUrl = `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&tags=${encodedTags}&pid=${page}&limit=${limit}&user_id=${credentials.userId}&api_key=${credentials.apiKey}`;
    try {
      const res = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'GoonScroll/1.0 (Rule34 Client; https://github.com/lalaliwe/goonscroll)',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const items = data.map(post => {
            const rawTags = (post.tags || '').trim().split(/\s+/).filter(Boolean);
            const isVideo = rawTags.includes('video') || rawTags.includes('animated') || (post.file_url && (post.file_url.endsWith('.mp4') || post.file_url.endsWith('.webm')));
            const mediaUrl = post.file_url || post.sample_url || post.image;
            const previewUrl = post.preview_url || post.sample_url || mediaUrl;
            const type = isVideo ? 'video' : detectMediaType(mediaUrl);

            return {
              id: `rule34_${post.id}`,
              sourceId: 'rule34',
              sourceName: 'Rule34',
              sourceUrl: `https://rule34.xxx/index.php?page=post&s=view&id=${post.id}`,
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
      }
    } catch (err) {
      console.warn('Rule34 API request failed, falling back to web parser:', err.message);
    }
  }

  // 2. Fallback: Web list parser (no API key required)
  // Send clean query tags upstream and filter blacklist on backend to avoid Cloudflare WAF blocks
  const cleanTags = tags.trim();
  const pid = page * 42;
  const webUrl = `https://rule34.xxx/index.php?page=post&s=list&tags=${encodeURIComponent(cleanTags)}&pid=${pid}`;

  try {
    const response = await fetch(webUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://rule34.xxx/',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      if (response.status === 404) return [];
      console.warn(`Rule34 web parser received HTTP ${response.status}`);
      return [];
    }

    const html = await response.text();
    const thumbRegex = /<span id="s(\d+)" class="thumb"[^>]*>[\s\S]*?<a [^>]*href="([^"]+)"[^>]*>[\s\S]*?<img src="([^"]+)"[\s\S]*?title="([^"]*)"/g;

    const items = [];
    let match;

    while ((match = thumbRegex.exec(html)) !== null) {
      const id = match[1];
      const postHref = match[2];
      const thumbSrc = match[3];
      const titleAttr = match[4] || '';

      const scoreMatch = titleAttr.match(/score:(-?\d+)/);
      const ratingMatch = titleAttr.match(/rating:([a-z]+)/);
      const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;
      const rating = ratingMatch ? normalizeRating(ratingMatch[1]) : 'e';

      const cleanTagsString = titleAttr.replace(/score:-?\d+/, '').replace(/rating:[a-z]+/, '').trim();
      const rawTags = cleanTagsString.split(/\s+/).filter(Boolean);

      // Extract folder & hash from thumbnail: https://wimg.rule34.xxx/thumbnails/3026/thumbnail_5554c672ff6cde194b3c5fe0398f7e67.jpg?18549485
      const cleanThumb = thumbSrc.split('?')[0];
      const isVideo = rawTags.includes('video') || rawTags.includes('webm') || rawTags.includes('mp4') || rawTags.includes('sound');
      const isGif = !isVideo && (rawTags.includes('animated_gif') || rawTags.includes('animated_image') || rawTags.includes('gif') || rawTags.includes('animated'));

      let mediaUrl;
      let type;

      if (isVideo) {
        // Videos on Rule34 are served on nymp4.rule34.xxx with .mp4
        mediaUrl = cleanThumb
          .replace('wimg.rule34.xxx', 'nymp4.rule34.xxx')
          .replace('/thumbnails/', '/images/')
          .replace('thumbnail_', '')
          .replace(/\.[a-z0-9]+$/i, '.mp4') + `?${id}`;
        type = 'video';
      } else if (isGif) {
        // Animated GIFs on Rule34 are served on wimg.rule34.xxx with .gif
        mediaUrl = cleanThumb
          .replace('/thumbnails/', '/images/')
          .replace('thumbnail_', '')
          .replace(/\.[a-z0-9]+$/i, '.gif') + `?${id}`;
        type = 'image';
      } else {
        // High-res images on Rule34
        mediaUrl = cleanThumb
          .replace('/thumbnails/', '/images/')
          .replace('thumbnail_', '')
          .replace(/\.[a-z0-9]+$/i, '.jpeg') + `?${id}`;
        type = detectMediaType(mediaUrl);
      }

      items.push({
        id: `rule34_${id}`,
        sourceId: 'rule34',
        sourceName: 'Rule34',
        sourceUrl: `https://rule34.xxx${postHref.startsWith('/') ? postHref : '/' + postHref}`,
        type,
        mediaUrl,
        previewUrl: thumbSrc,
        tags: {
          all: rawTags,
          general: rawTags,
          artist: [],
          character: [],
          copyright: [],
        },
        score,
        rating,
      });
    }

    return filterOutBlacklisted(items, blacklist);
  } catch (err) {
    console.error('Rule34 fetch error:', err.message);
    return [];
  }
}

export async function autocompleteRule34(query = '') {
  if (!query || query.length < 2) return [];
  const url = `https://api.rule34.xxx/autocomplete.php?q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer': 'https://rule34.xxx/',
      },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map(item => item.value || item.label || item).filter(Boolean);
    }
  } catch (err) {
    console.error('Rule34 autocomplete error:', err);
  }
  return [];
}
