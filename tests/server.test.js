import assert from 'assert';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDataDir = path.join(__dirname, 'temp_server_test_data');

process.env.DATA_DIR = testDataDir;
process.env.NODE_ENV = 'test';

const { default: app } = await import('../server/index.js');

async function testServer() {
  console.log('Testing Server API Routes...');

  if (fs.existsSync(testDataDir)) {
    fs.rmSync(testDataDir, { recursive: true, force: true });
  }

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Test /api/sources
    const resSources = await fetch(`${baseUrl}/api/sources`);
    assert.strictEqual(resSources.status, 200);
    const sourcesData = await resSources.json();
    assert.ok(Array.isArray(sourcesData.sources));
    assert.ok(sourcesData.sources.length >= 5);
    console.log('✔ GET /api/sources verified');

    // 2. Test /api/settings GET & POST
    const resSettings = await fetch(`${baseUrl}/api/settings`);
    assert.strictEqual(resSettings.status, 200);
    const settings = await resSettings.json();
    assert.ok(settings.blacklist);

    const updateRes = await fetch(`${baseUrl}/api/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferences: { defaultVolume: 0.5 } })
    });
    assert.strictEqual(updateRes.status, 200);
    const updatedSettings = await updateRes.json();
    assert.strictEqual(updatedSettings.preferences.defaultVolume, 0.5);
    console.log('✔ GET & POST /api/settings verified');

    // 3. Test /api/blacklist/add & /api/blacklist/remove
    const addRes = await fetch(`${baseUrl}/api/blacklist/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag: 'vore', source: 'global' })
    });
    assert.strictEqual(addRes.status, 200);
    const addData = await addRes.json();
    assert.ok(addData.blacklist.global.includes('vore'));

    const removeRes = await fetch(`${baseUrl}/api/blacklist/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag: 'vore', source: 'global' })
    });
    assert.strictEqual(removeRes.status, 200);
    const removeData = await removeRes.json();
    assert.strictEqual(removeData.blacklist.global.includes('vore'), false);
    console.log('✔ POST /api/blacklist/add and /remove verified');

    // 3b. Test /api/favorites/tags/add & /api/favorites/tags/remove
    const addFavTagRes = await fetch(`${baseUrl}/api/favorites/tags/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag: 'tomboy', source: 'global' })
    });
    assert.strictEqual(addFavTagRes.status, 200);
    const favTagData = await addFavTagRes.json();
    assert.ok(favTagData.favoriteTags.global.includes('tomboy'));

    const removeFavTagRes = await fetch(`${baseUrl}/api/favorites/tags/remove`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag: 'tomboy', source: 'global' })
    });
    assert.strictEqual(removeFavTagRes.status, 200);
    const removeFavTagData = await removeFavTagRes.json();
    assert.strictEqual(removeFavTagData.favoriteTags.global.includes('tomboy'), false);
    console.log('✔ POST /api/favorites/tags/add and /remove verified');

    // 4. Test /api/favorites/toggle
    const favItem = { id: 'test_123', sourceId: 'rule34', mediaUrl: 'https://example.com/test.mp4' };
    const favRes = await fetch(`${baseUrl}/api/favorites/toggle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item: favItem })
    });
    assert.strictEqual(favRes.status, 200);
    const favData = await favRes.json();
    assert.strictEqual(favData.isFavorited, true);

    const getFavs = await fetch(`${baseUrl}/api/favorites`);
    const favsList = await getFavs.json();
    assert.strictEqual(favsList.favorites.length, 1);
    console.log('✔ Favorites endpoints verified');

    // 5. Test /api/backup/export & import
    const exportRes = await fetch(`${baseUrl}/api/backup/export`);
    assert.strictEqual(exportRes.status, 200);
    const backupJson = await exportRes.json();
    assert.ok(backupJson.settings);
    assert.ok(backupJson.favorites);
    console.log('✔ Backup export verified');

    console.log('\nAll server integration tests passed successfully! 🎉');
  } finally {
    server.close();
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  }
}

testServer().catch(err => {
  console.error('Server test failed:', err);
  process.exit(1);
});
