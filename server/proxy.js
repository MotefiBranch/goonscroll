import http from 'http';
import https from 'https';
import { URL } from 'url';

/**
 * Helper to fetch a URL with redirection, multi-host resolution, and extension fallback.
 */
function fetchRemoteStream(targetUrl, forwardHeaders, callback, attempt = 0, initialCandidates = null) {
  let parsedUrl;
  try {
    parsedUrl = new URL(targetUrl);
  } catch (err) {
    return callback(new Error('Invalid URL'));
  }

  const client = parsedUrl.protocol === 'https:' ? https : http;

  let referer = `${parsedUrl.protocol}//${parsedUrl.host}/`;
  if (parsedUrl.host.includes('rule34.xxx')) {
    referer = 'https://rule34.xxx/';
  } else if (parsedUrl.host.includes('e621.net')) {
    referer = 'https://e621.net/';
  } else if (parsedUrl.host.includes('danbooru.donmai.us') || parsedUrl.host.includes('donmai.us')) {
    referer = 'https://danbooru.donmai.us/';
  } else if (parsedUrl.host.includes('yande.re')) {
    referer = 'https://yande.re/';
  } else if (parsedUrl.host.includes('konachan.net') || parsedUrl.host.includes('konachan.com')) {
    referer = 'https://konachan.com/';
  } else if (parsedUrl.host.includes('paheal.net') || parsedUrl.host.includes('paheal-cdn.net')) {
    referer = 'https://rule34.paheal.net/';
  }

  const headers = {
    ...forwardHeaders,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': referer,
    'Accept': '*/*',
  };

  const options = {
    method: 'GET',
    headers,
  };

  // Build candidate list once on first attempt
  let candidates = initialCandidates;
  if (!candidates) {
    const isR34 = targetUrl.includes('rule34.xxx');
    const cleanUrl = targetUrl.split('?')[0];
    const query = targetUrl.includes('?') ? '?' + targetUrl.split('?')[1] : '';

    if (isR34 && targetUrl.includes('/images/')) {
      const match = cleanUrl.match(/\/images\/([^\/]+)\/([^\.\/]+)/);
      if (match) {
        const folder = match[1];
        const hash = match[2];
        const allList = [
          targetUrl,
          `https://wimg.rule34.xxx/images/${folder}/${hash}.gif${query}`,
          `https://nymp4.rule34.xxx/images/${folder}/${hash}.mp4${query}`,
          `https://wimg.rule34.xxx/images/${folder}/${hash}.jpeg${query}`,
          `https://wimg.rule34.xxx/images/${folder}/${hash}.png${query}`,
          `https://wimg.rule34.xxx/images/${folder}/${hash}.jpg${query}`,
          `https://wimg.rule34.xxx/thumbnails/${folder}/thumbnail_${hash}.jpg${query}`
        ];
        candidates = Array.from(new Set(allList));
      } else {
        candidates = [targetUrl];
      }
    } else if (targetUrl.includes('/images/')) {
      const basePath = cleanUrl.substring(0, cleanUrl.lastIndexOf('.'));
      const fallbackExtensions = ['.jpeg', '.png', '.jpg', '.gif', '.mp4', '.webm'];
      candidates = Array.from(new Set([targetUrl, ...fallbackExtensions.map(ext => `${basePath}${ext}${query}`)]));
    } else {
      candidates = [targetUrl];
    }
  }

  const req = client.request(targetUrl, options, proxyRes => {
    // Handle redirect
    if (proxyRes.statusCode >= 300 && proxyRes.statusCode < 400 && proxyRes.headers.location) {
      return fetchRemoteStream(proxyRes.headers.location, forwardHeaders, callback, attempt, candidates);
    }

    // If 404 or 403 or server error, try next candidate in sequence
    if ((proxyRes.statusCode >= 400) && attempt + 1 < candidates.length) {
      proxyRes.resume();
      const nextCandidate = candidates[attempt + 1];
      return fetchRemoteStream(nextCandidate, forwardHeaders, callback, attempt + 1, candidates);
    }

    callback(null, proxyRes);
  });

  req.on('error', err => {
    if (attempt + 1 < candidates.length) {
      const nextCandidate = candidates[attempt + 1];
      return fetchRemoteStream(nextCandidate, forwardHeaders, callback, attempt + 1, candidates);
    }
    callback(err);
  });

  req.end();
  return req;
}

/**
 * Proxy media streams to bypass CORS, hotlinking referer blocks, and handle video range requests on iOS.
 */
export async function proxyMedia(req, res) {
  const targetUrl = req.query.url;
  if (!targetUrl) {
    return res.status(400).send('Missing url parameter');
  }

  const forwardHeaders = {};
  if (req.headers.range) {
    forwardHeaders['Range'] = req.headers.range;
  }

  const clientReq = fetchRemoteStream(targetUrl, forwardHeaders, (err, proxyRes) => {
    if (err) {
      console.error('Media proxy request error:', err.message);
      if (!res.headersSent) {
        return res.status(502).send('Error fetching remote media');
      }
      return;
    }

    res.status(proxyRes.statusCode);

    const headersToForward = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'last-modified',
      'etag',
    ];

    headersToForward.forEach(header => {
      if (proxyRes.headers[header]) {
        res.setHeader(header, proxyRes.headers[header]);
      }
    });

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    proxyRes.pipe(res);
  });

  req.on('close', () => {
    if (clientReq && !clientReq.destroyed) {
      clientReq.destroy();
    }
  });
}
