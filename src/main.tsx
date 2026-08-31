import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { Capacitor } from '@capacitor/core';
import { universalFetch } from './services/http';

// Install native network bridge for iOS / Android standalone execution
if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    try {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return (await universalFetch(url, init)) as any;
      }
      if (url.startsWith('/api') || url.startsWith('api/')) {
        return new Response(JSON.stringify({ error: 'Native local storage mode' }), {
          status: 404,
          statusText: 'Not Found',
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return originalFetch(input, init);
    } catch (err: any) {
      console.warn('Native fetch interceptor handled error:', err);
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        statusText: 'Error',
      });
    }
  };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
