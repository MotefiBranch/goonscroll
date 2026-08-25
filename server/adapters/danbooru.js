import { detectMediaType, normalizeRating, filterOutBlacklisted } from './types.js';

export async function fetchDanbooru({ tags = '', page = 1, limit = 40, blacklist = [], credentials = {} }) {
  const username = (credentials.username || '').trim();
  const apiKey = (credentials.apiKey || '').trim();
  const isAuthenticated = Boolean(username && apiKey);

  // Free anonymous users are strictly limited to 2 tags max on Danbooru
  const userTagList = (tags || '').trim().split(/\s+/).filter(Boolean);
  const queryTags = isAuthenticated ? userTagList.join(' ') : userTagList.slice(0, 2).join(' ');
  
  let url = `https://danbooru.donmai.us/posts.json?tags=${encodeURIComponent(queryTags)}&page=${page}&limit=${limit}`;

  const headers = {
    'User-Agent': isAuthenticated
      ? `GoonScroll/1.0 (user ${username})`
      : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  };

  if (isAuthenticated) {
    // Official Danbooru Authentication: HTTP Basic Auth & URL parameters
    const authString = Buffer.from(`${username}:${apiKey}`).toString('base64');
    headers['Authorization'] = `Basic ${authString}`;
    url += `&login=${encodeURIComponent(username)}&api_key=${encodeURIComponent(apiKey)}`;
  }

  try {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (response.status === 404 || response.status === 403 || response.status === 422 || response.status === 401) {
        console.warn(`Danbooru returned ${response.status} (Check username & API key in Settings -> Accounts if authentication fails)`);
        return [];
      }
      return [];
    }

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    const items = data
      .filter(post => post.file_url || post.large_file_url || post.media_asset?.variants?.length)
      .map(post => {
        let mediaUrl = post.large_file_url || post.file_url;
        let type = detectMediaType(mediaUrl);

        // Handle Danbooru Ugoira / Zip animations -> use webm/mp4 sample variant
        if (post.file_ext === 'zip' || (mediaUrl && mediaUrl.endsWith('.zip'))) {
          const videoVariant = post.media_asset?.variants?.find(v => v.file_ext === 'webm' || v.file_ext === 'mp4');
          if (videoVariant) {
            mediaUrl = videoVariant.url;
            type = 'video';
          } else if (post.large_file_url && !post.large_file_url.endsWith('.zip')) {
            mediaUrl = post.large_file_url;
            type = detectMediaType(mediaUrl);
          }
        }

        // Handle unrendered/missing mediaUrl -> use sample or 720p variant
        if (!mediaUrl || mediaUrl.endsWith('.zip')) {
          const sampleVariant = post.media_asset?.variants?.find(v => v.type === 'sample' || v.type === '720x720' || v.type === 'original');
          if (sampleVariant) {
            mediaUrl = sampleVariant.url;
            type = detectMediaType(mediaUrl);
          }
        }

        const previewUrl = post.preview_file_url || post.media_asset?.variants?.find(v => v.type === '360x360' || v.type === '180x180')?.url || mediaUrl;

        const generalTags = (post.tag_string_general || '').trim().split(/\s+/).filter(Boolean);
        const artistTags = (post.tag_string_artist || '').trim().split(/\s+/).filter(Boolean);
        const characterTags = (post.tag_string_character || '').trim().split(/\s+/).filter(Boolean);
        const copyrightTags = (post.tag_string_copyright || '').trim().split(/\s+/).filter(Boolean);
        const metaTags = (post.tag_string_meta || '').trim().split(/\s+/).filter(Boolean);
        const allTags = (post.tag_string || '').trim().split(/\s+/).filter(Boolean);

        return {
          id: `danbooru_${post.id}`,
          sourceId: 'danbooru',
          sourceName: 'Danbooru',
          sourceUrl: `https://danbooru.donmai.us/posts/${post.id}`,
          type,
          mediaUrl,
          previewUrl,
          tags: {
            all: allTags.length > 0 ? allTags : generalTags,
            general: generalTags,
            artist: artistTags,
            character: characterTags,
            copyright: copyrightTags,
            meta: metaTags,
          },
          score: post.score || 0,
          rating: normalizeRating(post.rating),
          width: post.image_width || 0,
          height: post.image_height || 0,
          aspectRatio: post.image_width && post.image_height ? post.image_width / post.image_height : undefined,
          author: artistTags.length > 0 ? artistTags[0] : undefined,
        };
      });

    return filterOutBlacklisted(items, blacklist);
  } catch (err) {
    console.error('Danbooru fetch error:', err.message);
    return [];
  }
}

export async function autocompleteDanbooru(query = '') {
  if (!query || query.length < 2) return [];
  const url = `https://danbooru.donmai.us/tags/autocomplete.json?search[name_matches]=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) {
      return data.map(item => item.name).filter(Boolean);
    }
  } catch (err) {
    console.error('Danbooru autocomplete error:', err);
  }
  return [];
}
