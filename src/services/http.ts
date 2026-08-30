import { Capacitor, registerPlugin } from '@capacitor/core';

interface NativeHttpInterface {
  request: (options: {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    data?: string;
  }) => Promise<{
    status: number;
    data: string;
    headers: Record<string, string>;
    url: string;
  }>;
}

const NativeHttp = registerPlugin<NativeHttpInterface>('NativeHttp');

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

  // If running natively on iOS / Android, execute via our custom Swift URLSession plugin
  if (Capacitor.isNativePlatform() && isExternalUrl) {
    try {
      const cleanHeaders = normalizeHeaders(options.headers);
      
      const res = await NativeHttp.request({
        url,
        method: options.method || 'GET',
        headers: cleanHeaders,
        data: typeof options.body === 'string' ? options.body : (options.body ? JSON.stringify(options.body) : undefined),
      });

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
              if (k.toLowerCase() === lower) return v;
            }
            return null;
          },
        },
      };
    } catch (err: any) {
      console.warn('NativeHttp plugin failed, falling back to browser fetch:', err.message);
      return fetch(url, options);
    }
  }

  // Otherwise, use standard browser fetch
  return fetch(url, options);
}
