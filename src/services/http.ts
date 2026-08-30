import { Capacitor, CapacitorHttp, HttpOptions } from '@capacitor/core';

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

  // If running natively on iOS / Android and accessing an external API
  if (Capacitor.isNativePlatform() && isExternalUrl) {
    try {
      const cleanHeaders = normalizeHeaders(options.headers);
      
      const httpOptions: HttpOptions = {
        url,
        method: options.method || 'GET',
        headers: cleanHeaders,
        data: options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : undefined,
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
    } catch (err: any) {
      console.warn('Native CapacitorHttp request failed, trying fallback:', err.message);
      return fetch(url, options);
    }
  }

  // Otherwise, use standard browser fetch
  return fetch(url, options);
}
