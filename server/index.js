import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import os from 'os';

import storage from './storage.js';
import { getFeed, getAutocomplete, SOURCES } from './adapters/index.js';
import { proxyMedia } from './proxy.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '8765', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Routes

// 1. Get Sources
app.get('/api/sources', (req, res) => {
  res.json({ sources: SOURCES });
});

// 2. Get Feed
app.get('/api/feed', async (req, res) => {
  try {
    const { source = 'rule34', tags = '', page = '1', limit = '40' } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 40));

    // Get active blacklist for this source
    const effectiveBlacklist = await storage.getEffectiveBlacklist(source);
    const settings = await storage.getSettings();

    const items = await getFeed({
      source,
      tags,
      page: pageNum,
      limit: limitNum,
      blacklist: effectiveBlacklist,
      credentials: settings.credentials || {},
    });

    res.json({
      source,
      page: pageNum,
      items,
      count: items.length,
    });
  } catch (err) {
    console.error('Error in /api/feed:', err.message);
    res.status(500).json({ error: err.message, items: [] });
  }
});

// 3. Autocomplete
app.get('/api/autocomplete', async (req, res) => {
  try {
    const { source = 'rule34', query = '' } = req.query;
    const suggestions = await getAutocomplete({ source, query });
    res.json({ suggestions });
  } catch (err) {
    console.error('Error in /api/autocomplete:', err.message);
    res.json({ suggestions: [] });
  }
});

// 4. Settings
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await storage.getSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const updated = await storage.updateSettings(req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Blacklist Operations
app.post('/api/blacklist/add', async (req, res) => {
  try {
    const { tag, source = 'global' } = req.body;
    if (!tag) return res.status(400).json({ error: 'Missing tag parameter' });
    const settings = await storage.addBlacklistTag(tag, source);
    res.json({ success: true, blacklist: settings.blacklist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/blacklist/remove', async (req, res) => {
  try {
    const { tag, source = 'global' } = req.body;
    if (!tag) return res.status(400).json({ error: 'Missing tag parameter' });
    const settings = await storage.removeBlacklistTag(tag, source);
    res.json({ success: true, blacklist: settings.blacklist });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Favorite Tags Operations
app.post('/api/favorites/tags/add', async (req, res) => {
  try {
    const { tag, source = 'global' } = req.body;
    if (!tag) return res.status(400).json({ error: 'Missing tag parameter' });
    const settings = await storage.addFavoriteTag(tag, source);
    res.json({ success: true, favoriteTags: settings.favoriteTags });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/favorites/tags/remove', async (req, res) => {
  try {
    const { tag, source = 'global' } = req.body;
    if (!tag) return res.status(400).json({ error: 'Missing tag parameter' });
    const settings = await storage.removeFavoriteTag(tag, source);
    res.json({ success: true, favoriteTags: settings.favoriteTags });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Favorite Posts
app.get('/api/favorites', async (req, res) => {
  try {
    const favorites = await storage.getFavorites();
    res.json({ favorites });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/favorites/toggle', async (req, res) => {
  try {
    const { item } = req.body;
    if (!item || !item.id) return res.status(400).json({ error: 'Missing item' });
    const result = await storage.toggleFavorite(item);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Backup Export & Import
app.get('/api/backup/export', async (req, res) => {
  try {
    const backup = await storage.exportBackup();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="goonscroll-backup-${Date.now()}.json"`);
    res.json(backup);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/backup/import', async (req, res) => {
  try {
    const result = await storage.importBackup(req.body);
    res.json({ success: true, result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 8. Media Stream Proxy
app.get('/api/proxy/media', proxyMedia);

// Static frontend serving (for production build)
const distDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('GoonScroll backend server is running on port ' + PORT + '. Run `npm run dev` to start the frontend dev server or `npm run build` for production.');
  });
}

function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, HOST, () => {
    const ips = getLocalIpAddresses();
    console.log(`\n==================================================`);
    console.log(`🚀 GoonScroll server is live!`);
    console.log(`📱 Local (This Device): http://localhost:${PORT}`);
    if (ips.length > 0) {
      ips.forEach(ip => {
        console.log(`🌐 LAN (Wi-Fi / Other Devices): http://${ip}:${PORT}`);
      });
    } else {
      console.log(`🌐 LAN: http://<your-device-ip>:${PORT}`);
    }
    console.log(`==================================================\n`);
  });
}

export default app;
