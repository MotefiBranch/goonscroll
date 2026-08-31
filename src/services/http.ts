import { Capacitor, CapacitorHttp, HttpOptions } from '@capacitor/core';

const rawFetch = typeof window !== 'undefined' ? window.fetch.bind(window) : fetch;

function normalizeHeaders(headers: any): Record<string, string> {
  const result: Record<string, string> = {};
  if (!headers) return result;
  if (typeof headers.forEach === 'function') {
    headers.forEach((val: string, key: string) => {
      result[key] = val;
    });
  } else if (typeof headers === 'object') {
    for (const [k, v] of Object.entries(headers)) {
      if (typeof v === 'string') {
        result[k] = v;
      }
    }
  }
  return result;
}

export async function universalFetch(url: string, options: any = {}) {
  const isExternalUrl = url.startsWith('http://') || url.startsWith('https://');

  if (Capacitor.isNativePlatform() && isExternalUrl) {
    const cleanHeaders = normalizeHeaders(options.headers);

    let parsedBody = undefined;
    if (options.body) {
      if (typeof options.body === 'string') {
        try {
          parsedBody = JSON.parse(options.body);
        } catch (e) {
          parsedBody = options.body;
        }
      } else {
        parsedBody = options.body;
      }
    }

    const httpOptions: HttpOptions = {
      url,
      method: options.method || 'GET',
      headers: cleanHeaders,
      data: parsedBody,
    };

    const res = await CapacitorHttp.request(httpOptions);

    return {
      ok: res.status >= 200 && res.status < 300,
      status: res.status,
      statusText: res.status === 200 ? 'OK' : `HTTP ${res.status}`,
      json: async () => {
        if (typeof res.data === 'string') {
          try {
            return JSON.parse(res.data);
          } catch (e) {
            return res.data;
          }
        }
        return res.data;
      },
      text: async () => {
        if (typeof res.data === 'string') return res.data;
        return JSON.stringify(res.data);
      },
      headers: {
        get: (headerName: string) => {
          const lower = headerName.toLowerCase();
          for (const [k, v] of Object.entries(res.headers || {})) {
            if (k.toLowerCase() === lower) return v as string;
          }
          return null;
        },
      },
    };
  }

  return rawFetch(url, options);
}
