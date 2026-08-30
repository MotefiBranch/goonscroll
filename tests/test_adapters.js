import { fetchDanbooru } from '../server/adapters/danbooru.js';
import { fetchRule34 } from '../server/adapters/rule34.js';
import { fetchE621 } from '../server/adapters/e621.js';
import { fetchYande } from '../server/adapters/yande.js';
import { fetchKonachan } from '../server/adapters/konachan.js';
import { fetchRule34Paheal } from '../server/adapters/rule34paheal.js';
import { fetchXbooru } from '../server/adapters/xbooru.js';

async function testAll() {
  console.log('Testing Booru Adapters Direct Queries:');
  
  try {
    const dan = await fetchDanbooru({ tags: '', page: 1, limit: 5 });
    console.log(`- Danbooru: ${dan.length} items`);
  } catch (e) {
    console.error(`- Danbooru Failed:`, e.message);
  }

  try {
    const r34 = await fetchRule34({ tags: '', page: 0, limit: 5 });
    console.log(`- Rule34: ${r34.length} items`);
  } catch (e) {
    console.error(`- Rule34 Failed:`, e.message);
  }

  try {
    const e6 = await fetchE621({ tags: '', page: 1, limit: 5 });
    console.log(`- e621: ${e6.length} items`);
  } catch (e) {
    console.error(`- e621 Failed:`, e.message);
  }

  try {
    const yande = await fetchYande({ tags: '', page: 1, limit: 5 });
    console.log(`- Yande: ${yande.length} items`);
  } catch (e) {
    console.error(`- Yande Failed:`, e.message);
  }

  try {
    const kona = await fetchKonachan({ tags: '', page: 1, limit: 5 });
    console.log(`- Konachan: ${kona.length} items`);
  } catch (e) {
    console.error(`- Konachan Failed:`, e.message);
  }

  try {
    const paheal = await fetchRule34Paheal({ tags: '', page: 0, limit: 5 });
    console.log(`- Paheal: ${paheal.length} items`);
  } catch (e) {
    console.error(`- Paheal Failed:`, e.message);
  }

  try {
    const xbooru = await fetchXbooru({ tags: '', page: 0, limit: 5 });
    console.log(`- Xbooru: ${xbooru.length} items`);
  } catch (e) {
    console.error(`- Xbooru Failed:`, e.message);
  }
}

testAll();
