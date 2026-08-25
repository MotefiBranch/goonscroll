import assert from 'assert';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const testDataDir = path.join(__dirname, 'temp_e2e_data');

process.env.DATA_DIR = testDataDir;
process.env.NODE_ENV = 'test';

const { default: app } = await import('../server/index.js');

async function testE2E() {
  console.log('Running End-to-End Verification Test...');

  if (fs.existsSync(testDataDir)) {
    fs.rmSync(testDataDir, { recursive: true, force: true });
  }

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Verify static frontend is served
    const indexRes = await fetch(`${baseUrl}/`);
    assert.strictEqual(indexRes.status, 200);
    const htmlText = await indexRes.text();
    assert.ok(htmlText.includes('<div id="root"'), 'Should serve SPA index.html');
    assert.ok(htmlText.includes('GoonScroll'), 'Should contain GoonScroll title');
    console.log('✔ SPA Frontend serving verified');

    // 2. Verify sources endpoint
    const sourcesRes = await fetch(`${baseUrl}/api/sources`);
    assert.strictEqual(sourcesRes.status, 200);
    const sourcesData = await sourcesRes.json();
    assert.ok(sourcesData.sources.some(s => s.id === 'rule34'));
    assert.ok(sourcesData.sources.some(s => s.id === 'e621'));
    console.log('✔ Source list verified');

    // 3. Verify blacklist add and retrieval
    await fetch(`${baseUrl}/api/blacklist/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tag: 'fart', source: 'global' }),
    });

    const settingsRes = await fetch(`${baseUrl}/api/settings`);
    const settingsData = await settingsRes.json();
    assert.ok(settingsData.blacklist.global.includes('fart'));
    console.log('✔ Blacklist persistence verified');

    // 4. Verify media proxy
    const proxyRes = await fetch(`${baseUrl}/api/proxy/media?url=https://httpbin.org/bytes/1024`);
    assert.strictEqual(proxyRes.status, 200);
    assert.ok(proxyRes.headers.get('access-control-allow-origin'), 'CORS header should be set');
    console.log('✔ Media proxy and CORS stream verified');

    console.log('\n🎉 End-to-End Verification Passed 100%!\n');
  } finally {
    server.close();
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  }
}

testE2E().catch(err => {
  console.error('E2E Verification Failed:', err);
  process.exit(1);
});
