import assert from 'assert';
import { buildQueryTags, filterOutBlacklisted, detectMediaType, normalizeRating } from '../server/adapters/types.js';
import { getFeed, getAutocomplete, SOURCES } from '../server/adapters/index.js';

async function testAdapters() {
  console.log('Testing Booru Adapters & Tag Logic...');

  // 1. Tag Query Builder with Negative Injections
  const tags1 = buildQueryTags('catgirl solo', ['scat', 'fart', 'guro']);
  assert.strictEqual(tags1, 'catgirl solo -scat -fart -guro');

  const tags2 = buildQueryTags('', ['watersports']);
  assert.strictEqual(tags2, '-watersports');
  console.log('✔ Negative tag injection formatting verified');

  // 2. Media Type & Rating normalization
  assert.strictEqual(detectMediaType('https://example.com/sample.mp4'), 'video');
  assert.strictEqual(detectMediaType('https://example.com/sample.webm?token=123'), 'video');
  assert.strictEqual(detectMediaType('https://example.com/sample.gif'), 'gif');
  assert.strictEqual(detectMediaType('https://example.com/sample.jpg'), 'image');

  assert.strictEqual(normalizeRating('explicit'), 'e');
  assert.strictEqual(normalizeRating('questionable'), 'q');
  assert.strictEqual(normalizeRating('safe'), 's');
  console.log('✔ Media detection and rating normalization verified');

  // 3. Blacklist In-Memory Purging
  const dummyFeed = [
    { id: '1', tags: { all: ['cat', 'maid', 'happy'] } },
    { id: '2', tags: { all: ['dog', 'scat', 'furry'] } },
    { id: '3', tags: { all: ['anime', 'guro'] } },
    { id: '4', tags: { all: ['solo', 'female'] } }
  ];
  const filtered = filterOutBlacklisted(dummyFeed, ['scat', 'guro']);
  assert.strictEqual(filtered.length, 2);
  assert.deepStrictEqual(filtered.map(i => i.id), ['1', '4']);
  console.log('✔ Secondary blacklist filter verified');

  // 4. Source list check
  assert.ok(SOURCES.some(s => s.id === 'rule34'));
  assert.ok(SOURCES.some(s => s.id === 'e621'));
  assert.ok(SOURCES.some(s => s.id === 'danbooru'));
  console.log('✔ Source definitions verified');

  console.log('\nAll adapter tests passed successfully! 🎉');
}

testAdapters().catch(err => {
  console.error('Adapter test failed:', err);
  process.exit(1);
});
