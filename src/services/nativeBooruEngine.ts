import { universalFetch } from './http';
import { XMLParser } from 'fast-xml-parser';
import { FeedItem } from '../types/feed';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
});

function detectMediaType(url = ''): 'video' | 'image' | 'gif' {
  const cleanUrl = url.split('?')[0].toLowerCase();
  if (cleanUrl.endsWith('.mp4') || cleanUrl.endsWith('.webm') || cleanUrl.endsWith('.mov')) {
    return 'video';
  }
  if (cleanUrl.endsWith('.gif')) {
    return 'gif';
  }
  return 'image';
}

function normalizeRating(rating = ''): 's' | 'q' | 'e' {
  const r = (rating || '').toLowerCase();
  if (r === 'explicit' || r === 'e') return 'e';
  if (r === 'questionable' || r === 'q') return 'q';
  if (r === 'safe' || r === 'general' || r === 's' || r === 'g') return 's';
  return 'e';
}

function filterOutBlacklisted(items: FeedItem[] = [], blacklist: string[] = []): FeedItem[] {
  if (!blacklist || blacklist.length === 0) return items;
  const blacklistSet = new Set(blacklist.map(t => t.toLowerCase().trim()));

  return items.filter(item => {
    if (!item.tags || !item.tags.all) return true;
    for (const tag of item.tags.all) {
      if (blacklistSet.has(tag.toLowerCase().trim())) {
        return false;
      }
    }
    return true;
  });
}

// 1. Rule34 (Full-resolution JSON API with fallback)
export async function fetchNativeRule34({ tags = '', page = 0, limit = 42, blacklist = [] as string[], credentials = {} as any }): Promise<FeedItem[]> {
  const encodedTags = encodeURIComponent(tags.trim());
  let apiUrl = `https://api.rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&tags=${encodedTags}&pid=${page}&limit=${limit}`;
  
  if (credentials.userId && credentials.apiKey) {
    apiUrl += `&user_id=${credentials.userId}&api_key=${credentials.apiKey}`;
  }

  try {
    const res = await universalFetch(apiUrl, {
      headers: {
        'User-Agent': 'GoonScroll/1.0 (Rule34 Client; https://github.com/lalaliwe/goonscroll)',
        'Accept': 'application/json',
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const items: FeedItem[] = data.map((post: any) => {
          const rawTags = (post.tags || '').trim().split(/\s+/).filter(Boolean);
          const isVideo = rawTags.includes('video') || rawTags.includes('animated') || (post.file_url && (post.file_url.endsWith('.mp4') || post.file_url.endsWith('.webm')));
          
          // Full resolution master file
          const mediaUrl = post.file_url || post.sample_url || post.image;
          const previewUrl = post.sample_url || post.preview_url || mediaUrl;

          return {
            id: `rule34_${post.id}`,
            sourceId: 'rule34',
            sourceName: 'Rule34',
            sourceUrl: `https://rule34.xxx/index.php?page=post&s=view&id=${post.id}`,
            type: isVideo ? 'video' : detectMediaType(mediaUrl),
            mediaUrl,
            previewUrl,
            tags: { all: rawTags, general: rawTags },
            score: parseInt(post.score || '0', 10),
            rating: normalizeRating(post.rating),
            width: parseInt(post.width || '0', 10),
            height: parseInt(post.height || '0', 10),
            aspectRatio: post.width && post.height ? parseInt(post.width, 10) / parseInt(post.height, 10) : undefined,
          };
        });

        return filterOutBlacklisted(items, blacklist);
      }
    }
  } catch (err: any) {
    console.warn('Rule34 JSON API query failed:', err.message);
  }

  return [];
}

// 2. Danbooru
export async function fetchNativeDanbooru({ tags = '', page = 1, limit = 30, blacklist = [] as string[], credentials = {} as any }): Promise<FeedItem[]> {
  const queryList = (tags || '').trim().split(/\s+/).filter(Boolean);
  const negativeList = (blacklist || []).map(t => `-${t.trim().toLowerCase()}`).filter(Boolean);
  const combinedTags = [...queryList, ...negativeList.slice(0, 2)].join(' ');

  let apiUrl = `https://danbooru.donmai.us/posts.json?tags=${encodeURIComponent(combinedTags)}&page=${page}&limit=${limit}`;
  if (credentials.username && credentials.apiKey) {
    apiUrl += `&login=${encodeURIComponent(credentials.username)}&api_key=${encodeURIComponent(credentials.apiKey)}`;
  }

  const res = await universalFetch(apiUrl, {
    headers: {
      'User-Agent': 'GoonScroll/1.0 (Danbooru Client; https://github.com/lalaliwe/goonscroll)',
      'Accept': 'application/json',
    },
  });

  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data)) return [];

  const items: FeedItem[] = data.map(post => {
    const rawTags = (post.tag_string || '').trim().split(/\s+/).filter(Boolean);
    const isUgoira = post.file_ext === 'zip';
    const variants = post.media_asset?.variants || [];
    const webmVariant = variants.find((v: any) => v.file_ext === 'webm' || v.file_ext === 'mp4');

    // Prefer full-resolution file_url
    let mediaUrl = post.file_url || post.large_file_url || post.preview_file_url;
    let type: 'video' | 'image' | 'gif' = detectMediaType(mediaUrl);

    if (isUgoira && webmVariant) {
      mediaUrl = webmVariant.url;
      type = 'video';
    } else if (post.file_ext === 'webm' || post.file_ext === 'mp4') {
      type = 'video';
    } else if (post.file_ext === 'gif') {
      type = 'gif';
    }

    return {
      id: `danbooru_${post.id}`,
      sourceId: 'danbooru',
      sourceName: 'Danbooru',
      sourceUrl: `https://danbooru.donmai.us/posts/${post.id}`,
      type,
      mediaUrl,
      previewUrl: post.large_file_url || post.preview_file_url || mediaUrl,
      tags: {
        all: rawTags,
        general: (post.tag_string_general || '').split(/\s+/).filter(Boolean),
        artist: (post.tag_string_artist || '').split(/\s+/).filter(Boolean),
        character: (post.tag_string_character || '').split(/\s+/).filter(Boolean),
        copyright: (post.tag_string_copyright || '').split(/\s+/).filter(Boolean),
      },
      score: post.score || 0,
      rating: normalizeRating(post.rating),
      width: post.image_width,
      height: post.image_height,
      aspectRatio: post.image_width && post.image_height ? post.image_width / post.image_height : undefined,
    };
  });

  return filterOutBlacklisted(items, blacklist);
}

// 3. e621
export async function fetchNativeE621({ tags = '', page = 1, limit = 40, blacklist = [] as string[], credentials = {} as any }): Promise<FeedItem[]> {
  const queryList = (tags || '').trim().split(/\s+/).filter(Boolean);
  const negativeList = (blacklist || []).map(t => `-${t.trim().toLowerCase()}`).filter(Boolean);
  const combinedTags = [...queryList, ...negativeList.slice(0, 5)].join(' ');

  let apiUrl = `https://e621.net/posts.json?tags=${encodeURIComponent(combinedTags)}&page=${page}&limit=${limit}`;
  if (credentials.username && credentials.apiKey) {
    apiUrl += `&login=${encodeURIComponent(credentials.username)}&api_key=${encodeURIComponent(credentials.apiKey)}`;
  }

  const res = await universalFetch(apiUrl, {
    headers: {
      'User-Agent': 'GoonScroll/1.0 (by Duck on iOS; https://github.com/lalaliwe/goonscroll)',
      'Accept': 'application/json',
    },
  });

  if (!res.ok) return [];
  const data = await res.json();
  if (!data.posts || !Array.isArray(data.posts)) return [];

  const items: FeedItem[] = data.posts
    .filter((post: any) => post.file && post.file.url)
    .map((post: any) => {
      const allTags = Object.values(post.tags || {}).flat().filter(Boolean) as string[];
      const mediaUrl = post.file.url;
      const previewUrl = post.sample?.url || post.preview?.url || mediaUrl;
      const type = detectMediaType(mediaUrl);

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
          general: post.tags?.general || [],
          artist: post.tags?.artist || [],
          character: post.tags?.character || [],
          copyright: post.tags?.copyright || [],
        },
        score: post.score?.total || 0,
        rating: normalizeRating(post.rating),
        width: post.file?.width,
        height: post.file?.height,
        aspectRatio: post.file?.width && post.file?.height ? post.file.width / post.file.height : undefined,
      };
    });

  return filterOutBlacklisted(items, blacklist);
}

// 4. Yande.re (High Quality HQ/Master files)
export async function fetchNativeYande({ tags = '', page = 1, limit = 40, blacklist = [] as string[] }): Promise<FeedItem[]> {
  const encodedTags = encodeURIComponent(tags.trim());
  const apiUrl = `https://yande.re/post.json?tags=${encodedTags}&page=${page}&limit=${limit}`;

  const res = await universalFetch(apiUrl, {
    headers: {
      'User-Agent': 'GoonScroll/1.0 (Yande Client; https://github.com/lalaliwe/goonscroll)',
      'Accept': 'application/json',
    },
  });

  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data)) return [];

  const items: FeedItem[] = data.map((post: any) => {
    const rawTags = (post.tags || '').trim().split(/\s+/).filter(Boolean);
    const mediaUrl = post.file_url || post.jpeg_url || post.sample_url;
    const previewUrl = post.sample_url || post.preview_url || mediaUrl;

    return {
      id: `yande_${post.id}`,
      sourceId: 'yande',
      sourceName: 'Yande.re',
      sourceUrl: `https://yande.re/post/show/${post.id}`,
      type: detectMediaType(mediaUrl),
      mediaUrl,
      previewUrl,
      tags: { all: rawTags, general: rawTags },
      score: post.score || 0,
      rating: normalizeRating(post.rating),
      width: post.width,
      height: post.height,
      aspectRatio: post.width && post.height ? post.width / post.height : undefined,
    };
  });

  return filterOutBlacklisted(items, blacklist);
}

// 5. Konachan (High Quality Full Resolution)
export async function fetchNativeKonachan({ tags = '', page = 1, limit = 40, blacklist = [] as string[] }): Promise<FeedItem[]> {
  const encodedTags = encodeURIComponent(tags.trim());
  const apiUrl = `https://konachan.com/post.json?tags=${encodedTags}&page=${page}&limit=${limit}`;

  const res = await universalFetch(apiUrl, {
    headers: {
      'User-Agent': 'GoonScroll/1.0 (Konachan Client; https://github.com/lalaliwe/goonscroll)',
      'Accept': 'application/json',
    },
  });

  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data)) return [];

  const items: FeedItem[] = data.map((post: any) => {
    const rawTags = (post.tags || '').trim().split(/\s+/).filter(Boolean);
    const mediaUrl = post.file_url || post.jpeg_url || post.sample_url;
    const previewUrl = post.sample_url || post.preview_url || mediaUrl;

    return {
      id: `konachan_${post.id}`,
      sourceId: 'konachan',
      sourceName: 'Konachan',
      sourceUrl: `https://konachan.com/post/show/${post.id}`,
      type: detectMediaType(mediaUrl),
      mediaUrl,
      previewUrl,
      tags: { all: rawTags, general: rawTags },
      score: post.score || 0,
      rating: normalizeRating(post.rating),
      width: post.width,
      height: post.height,
      aspectRatio: post.width && post.height ? post.width / post.height : undefined,
    };
  });

  return filterOutBlacklisted(items, blacklist);
}

// 6. Gelbooru
export async function fetchNativeGelbooru({ tags = '', page = 0, limit = 40, blacklist = [] as string[], credentials = {} as any }): Promise<FeedItem[]> {
  const encodedTags = encodeURIComponent(tags.trim());
  let apiUrl = `https://gelbooru.com/index.php?page=dapi&s=post&q=index&json=1&tags=${encodedTags}&pid=${page}&limit=${limit}`;
  if (credentials.userId && credentials.apiKey) {
    apiUrl += `&user_id=${credentials.userId}&api_key=${credentials.apiKey}`;
  }

  const res = await universalFetch(apiUrl, {
    headers: {
      'User-Agent': 'GoonScroll/1.0 (Gelbooru Client; https://github.com/lalaliwe/goonscroll)',
      'Accept': 'application/json',
    },
  });

  if (!res.ok) return [];
  const data = await res.json();
  const postList = data.post || data.posts || (Array.isArray(data) ? data : []);

  const items: FeedItem[] = postList.map((post: any) => {
    const rawTags = (post.tags || '').trim().split(/\s+/).filter(Boolean);
    const mediaUrl = post.file_url || post.sample_url || post.image;
    const previewUrl = post.sample_url || post.preview_url || mediaUrl;

    return {
      id: `gelbooru_${post.id}`,
      sourceId: 'gelbooru',
      sourceName: 'Gelbooru',
      sourceUrl: `https://gelbooru.com/index.php?page=post&s=view&id=${post.id}`,
      type: detectMediaType(mediaUrl),
      mediaUrl,
      previewUrl,
      tags: { all: rawTags, general: rawTags },
      score: parseInt(post.score || '0', 10),
      rating: normalizeRating(post.rating),
      width: parseInt(post.width || '0', 10),
      height: parseInt(post.height || '0', 10),
      aspectRatio: post.width && post.height ? parseInt(post.width, 10) / parseInt(post.height, 10) : undefined,
    };
  });

  return filterOutBlacklisted(items, blacklist);
}

// 7. Xbooru
export async function fetchNativeXbooru({ tags = '', page = 0, limit = 40, blacklist = [] as string[] }): Promise<FeedItem[]> {
  const encodedTags = encodeURIComponent(tags.trim());
  const apiUrl = `https://xbooru.com/index.php?page=dapi&s=post&q=index&json=1&tags=${encodedTags}&pid=${page}&limit=${limit}`;

  const res = await universalFetch(apiUrl, {
    headers: {
      'User-Agent': 'GoonScroll/1.0 (Xbooru Client; https://github.com/lalaliwe/goonscroll)',
      'Accept': 'application/json',
    },
  });

  if (!res.ok) return [];
  const data = await res.json();
  if (!Array.isArray(data)) return [];

  const items: FeedItem[] = data.map((post: any) => {
    const rawTags = (post.tags || '').trim().split(/\s+/).filter(Boolean);
    const mediaUrl = post.file_url || post.sample_url || post.image;
    const previewUrl = post.sample_url || post.preview_url || mediaUrl;

    return {
      id: `xbooru_${post.id}`,
      sourceId: 'xbooru',
      sourceName: 'Xbooru',
      sourceUrl: `https://xbooru.com/index.php?page=post&s=view&id=${post.id}`,
      type: detectMediaType(mediaUrl),
      mediaUrl,
      previewUrl,
      tags: { all: rawTags, general: rawTags },
      score: parseInt(post.score || '0', 10),
      rating: normalizeRating(post.rating),
      width: parseInt(post.width || '0', 10),
      height: parseInt(post.height || '0', 10),
      aspectRatio: post.width && post.height ? parseInt(post.width, 10) / parseInt(post.height, 10) : undefined,
    };
  });

  return filterOutBlacklisted(items, blacklist);
}

// 8. Rule34 Paheal (XML API)
export async function fetchNativePaheal({ tags = '', page = 1, limit = 40, blacklist = [] as string[] }): Promise<FeedItem[]> {
  const encodedTags = encodeURIComponent(tags.trim());
  const apiUrl = `https://rule34.paheal.net/api/danbooru/find_posts/index.xml?tags=${encodedTags}&limit=${limit}&page=${page}`;

  const res = await universalFetch(apiUrl, {
    headers: {
      'User-Agent': 'GoonScroll/1.0 (Paheal Client; https://github.com/lalaliwe/goonscroll)',
    },
  });

  if (!res.ok) return [];
  const xmlText = await res.text();
  const parsed = xmlParser.parse(xmlText);
  const postsRaw = parsed?.posts?.tag || parsed?.posts?.post || [];
  const postList = Array.isArray(postsRaw) ? postsRaw : [postsRaw].filter(Boolean);

  const items: FeedItem[] = postList.map((post: any) => {
    const rawTags = (post.tags || '').trim().split(/\s+/).filter(Boolean);
    const mediaUrl = post.file_url || post.sample_url || post.preview_url;
    const previewUrl = post.preview_url || post.sample_url || mediaUrl;

    return {
      id: `paheal_${post.id}`,
      sourceId: 'rule34paheal',
      sourceName: 'Rule34 Paheal',
      sourceUrl: `https://rule34.paheal.net/post/view/${post.id}`,
      type: detectMediaType(mediaUrl),
      mediaUrl,
      previewUrl,
      tags: { all: rawTags, general: rawTags },
      score: parseInt(post.score || '0', 10),
      rating: normalizeRating(post.rating),
      width: parseInt(post.width || '0', 10),
      height: parseInt(post.height || '0', 10),
      aspectRatio: post.width && post.height ? parseInt(post.width, 10) / parseInt(post.height, 10) : undefined,
    };
  });

  return filterOutBlacklisted(items, blacklist);
}

// Unified Full-Resolution Native Router
export async function getNativeFeed({
  source = 'rule34',
  tags = '',
  page = 1,
  limit = 40,
  blacklist = [] as string[],
  credentials = {} as any,
}): Promise<FeedItem[]> {
  const normalizedSource = source.toLowerCase().trim();

  switch (normalizedSource) {
    case 'rule34':
      return fetchNativeRule34({ tags, page: Math.max(0, page - 1), limit, blacklist, credentials: credentials.rule34 || {} });
    case 'danbooru':
      return fetchNativeDanbooru({ tags, page, limit, blacklist, credentials: credentials.danbooru || {} });
    case 'e621':
      return fetchNativeE621({ tags, page, limit, blacklist, credentials: credentials.e621 || {} });
    case 'yande':
    case 'yandere':
      return fetchNativeYande({ tags, page, limit, blacklist });
    case 'konachan':
      return fetchNativeKonachan({ tags, page, limit, blacklist });
    case 'gelbooru':
      return fetchNativeGelbooru({ tags, page: Math.max(0, page - 1), limit, blacklist, credentials: credentials.gelbooru || {} });
    case 'xbooru':
      return fetchNativeXbooru({ tags, page: Math.max(0, page - 1), limit, blacklist });
    case 'rule34paheal':
    case 'paheal':
      return fetchNativePaheal({ tags, page, limit, blacklist });
    default:
      return fetchNativeRule34({ tags, page: Math.max(0, page - 1), limit, blacklist, credentials: credentials.rule34 || {} });
  }
}
