import { detectMediaType, filterOutBlacklisted } from './types.js';

export async function fetchReddit({ subreddit = 'nsfw_gifs', after = '', limit = 30, blacklist = [] }) {
  const cleanSub = (subreddit || 'nsfw_gifs').replace(/^r\//, '').trim();
  const url = `https://www.reddit.com/r/${cleanSub}/hot.json?limit=${limit}${after ? `&after=${after}` : ''}`;

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) GoonScroll/1.0',
    },
  });

  if (!response.ok) {
    if (response.status === 404) return [];
    throw new Error(`Reddit API error: ${response.status}`);
  }

  const json = await response.json();
  const children = json.data?.children || [];

  const items = children
    .filter(c => c.data && !c.data.is_self && (c.data.url_overridden_by_dest || c.data.url))
    .map(c => {
      const post = c.data;
      let mediaUrl = post.url_overridden_by_dest || post.url;
      let type = detectMediaType(mediaUrl);

      // Handle v.redd.it video / mp4
      if (post.is_video && post.media?.reddit_video?.fallback_url) {
        mediaUrl = post.media.reddit_video.fallback_url;
        type = 'video';
      } else if (mediaUrl.includes('redgifs.com/watch/')) {
        // Redgifs embed fallback or direct link
        type = 'video';
      }

      // Extract title as tags
      const titleWords = (post.title || '')
        .toLowerCase()
        .replace(/[^a-z0-9_ ]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2);

      const previewUrl = post.thumbnail && post.thumbnail.startsWith('http') ? post.thumbnail : mediaUrl;

      return {
        id: `reddit_${post.id}`,
        sourceId: 'reddit',
        sourceName: `r/${post.subreddit}`,
        sourceUrl: `https://reddit.com${post.permalink}`,
        type,
        mediaUrl,
        previewUrl,
        tags: {
          all: [post.subreddit.toLowerCase(), ...titleWords],
          general: titleWords,
          artist: [],
          character: [],
          copyright: [],
        },
        score: post.score || 0,
        rating: 'e',
        author: post.author,
      };
    });

  return filterOutBlacklisted(items, blacklist);
}
