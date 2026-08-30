import { Capacitor, CapacitorHttp, HttpOptions } from '@capacitor/core';

export async function universalFetch(url: string, options: any = {}) {
  // If running natively on iOS / Android, execute via native NSURLSession (CapacitorHttp)
  if (Capacitor.isNativePlatform()) {
    try {
      const httpOptions: HttpOptions = {
        url,
        method: options.method || 'GET',
        headers: options.headers || {},
        data: options.body,
        // Ensure raw response data is parsed appropriately
        responseType: options.responseType || 'text',
      };

      const res = await CapacitorHttp.request(httpOptions);

      return {
        ok: res.status >= 200 && res.status < 300,
        status: res.status,
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
      console.error('CapacitorHttp native request failed:', err.message);
      throw err;
    }
  }

  // Otherwise, use standard browser fetch
  return fetch(url, options);
}
