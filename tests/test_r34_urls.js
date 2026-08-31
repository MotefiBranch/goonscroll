async function testExtensions(dir, hash, id) {
  const exts = ['.jpg', '.jpeg', '.png', '.webp'];
  for (const ext of exts) {
    const url = `https://wimg.rule34.xxx//images/${dir}/${hash}${ext}?${id}`;
    const res = await fetch(url, { method: 'HEAD' });
    console.log(`[images] ${url} -> Status: ${res.status}`);
  }
}

async function testSample(dir, hash, id) {
  const url = `https://wimg.rule34.xxx//samples/${dir}/sample_${hash}.jpg?${id}`;
  const res = await fetch(url, { method: 'HEAD' });
  console.log(`[sample] ${url} -> Status: ${res.status}`);
}

async function main() {
  console.log('--- Post 18610686 ---');
  await testExtensions('480', '559a960b2b5bf98837cbfe2702b04bfc', '18610686');
  await testSample('480', '559a960b2b5bf98837cbfe2702b04bfc', '18610686');

  console.log('\n--- Post 18610683 ---');
  await testExtensions('480', '3ec23b7b6e0ded16e56d0fe20a244d9f', '18610683');
  await testSample('480', '3ec23b7b6e0ded16e56d0fe20a244d9f', '18610683');
}

main();
