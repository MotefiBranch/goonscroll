import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDataDir = path.join(__dirname, 'temp_test_data');

// Clean up old test dir before setting env
if (fs.existsSync(testDataDir)) {
  fs.rmSync(testDataDir, { recursive: true, force: true });
}

// Set test data dir
process.env.DATA_DIR = testDataDir;

const { storage } = await import('../server/storage.js');

async function runTests() {
  console.log('Testing Storage Engine...');

  // Reset in-memory settings to default clean state
  storage.settings = storage.loadSettings();
  storage.favorites = storage.loadFavorites();

  // 1. Initial load
  const settings = await storage.getSettings();
  assert.ok(settings.blacklist, 'Should have blacklist structure');
  assert.strictEqual(Array.isArray(settings.blacklist.global), true, 'Global blacklist should be array');
  assert.strictEqual(settings.preferences.port, 8765, 'Default port should be 8765');
  console.log('✔ Initial settings verified');

  // 2. Add global blacklist tag
  await storage.addBlacklistTag('scat');
  await storage.addBlacklistTag('SCAT'); // test case normalization / duplicate check
  await storage.addBlacklistTag('fart', 'global');
  const s2 = await storage.getSettings();
  assert.deepStrictEqual(s2.blacklist.global, ['scat', 'fart']);
  console.log('✔ Global blacklist add & deduplication verified');

  // 3. Add source-specific blacklist tag
  await storage.addBlacklistTag('feral', 'e621');
  await storage.addBlacklistTag('bad_anatomy', 'rule34');
  const s3 = await storage.getSettings();
  assert.deepStrictEqual(s3.blacklist.bySource.e621, ['feral']);
  assert.deepStrictEqual(s3.blacklist.bySource.rule34, ['bad_anatomy']);
  console.log('✔ Source-specific blacklist verified');

  // 4. Effective blacklist query
  const effectiveRule34 = await storage.getEffectiveBlacklist('rule34');
  assert.ok(effectiveRule34.includes('scat'));
  assert.ok(effectiveRule34.includes('fart'));
  assert.ok(effectiveRule34.includes('bad_anatomy'));
  assert.strictEqual(effectiveRule34.includes('feral'), false);
  console.log('✔ Effective blacklist resolution verified');

  // 5. Remove blacklist tag
  await storage.removeBlacklistTag('scat', 'global');
  const s4 = await storage.getSettings();
  assert.deepStrictEqual(s4.blacklist.global, ['fart']);
  console.log('✔ Blacklist removal verified');

  // 5b. Favorite Tags (Global & Source Specific)
  await storage.addFavoriteTag('catgirl', 'global');
  await storage.addFavoriteTag('CATGIRL'); // test deduplication
  await storage.addFavoriteTag('tomboy', 'global');
  await storage.addFavoriteTag('latex', 'rule34');
  await storage.addFavoriteTag('furry', 'e621');

  const s4b = await storage.getSettings();
  assert.deepStrictEqual(s4b.favoriteTags.global, ['catgirl', 'tomboy']);
  assert.deepStrictEqual(s4b.favoriteTags.bySource.rule34, ['latex']);
  assert.deepStrictEqual(s4b.favoriteTags.bySource.e621, ['furry']);

  const effFavsR34 = await storage.getEffectiveFavoriteTags('rule34');
  assert.ok(effFavsR34.includes('catgirl'));
  assert.ok(effFavsR34.includes('tomboy'));
  assert.ok(effFavsR34.includes('latex'));
  assert.strictEqual(effFavsR34.includes('furry'), false);

  await storage.removeFavoriteTag('tomboy', 'global');
  const s4c = await storage.getSettings();
  assert.deepStrictEqual(s4c.favoriteTags.global, ['catgirl']);
  console.log('✔ Favorite tags add, remove & resolution verified');

  // 6. Favorites toggle
  const dummyItem = { id: 'r34_999', sourceId: 'rule34', mediaUrl: 'https://example.com/video.mp4', tags: { all: ['cat'] } };
  const res1 = await storage.toggleFavorite(dummyItem);
  assert.strictEqual(res1.isFavorited, true);
  assert.strictEqual(await storage.isFavorited('r34_999'), true);

  const res2 = await storage.toggleFavorite(dummyItem);
  assert.strictEqual(res2.isFavorited, false);
  assert.strictEqual(await storage.isFavorited('r34_999'), false);
  console.log('✔ Favorites toggle verified');

  // 7. Backup Export & Import
  await storage.addBlacklistTag('tentacles', 'global');
  await storage.toggleFavorite(dummyItem);
  const backup = await storage.exportBackup();
  assert.ok(backup.settings.blacklist.global.includes('tentacles'));
  assert.strictEqual(backup.favorites.length, 1);

  // Clear and re-import
  await storage.removeBlacklistTag('tentacles', 'global');
  await storage.toggleFavorite(dummyItem); // unfavorite
  assert.strictEqual(await storage.isFavorited('r34_999'), false);

  await storage.importBackup(backup);
  const s5 = await storage.getSettings();
  assert.ok(s5.blacklist.global.includes('tentacles'));
  assert.strictEqual(await storage.isFavorited('r34_999'), true);
  console.log('✔ Backup export & import verified');

  // Clean up
  fs.rmSync(testDataDir, { recursive: true, force: true });
  console.log('\nAll storage tests passed successfully! 🎉');
}

runTests().catch(err => {
  console.error('Storage test failed:', err);
  process.exit(1);
});
