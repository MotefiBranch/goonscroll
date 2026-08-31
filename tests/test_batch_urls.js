async function testUrls(id, dir, hash) {
  console.log(`\n=== Post ${id} ===`);
  const exts = ['.png', '.jpg', '.jpeg', '.webp'];
  for (const ext of exts) {
    const imgUrl = `https://wimg.rule34.xxx/images/${dir}/${hash}${ext}?${id}`;
    const res = await fetch(imgUrl, { method: 'HEAD' });
    console.log(`[images] ${imgUrl} -> Status: ${res.status}`);
  }
  const sampleUrl = `https://wimg.rule34.xxx/samples/${dir}/sample_${hash}.jpg?${id}`;
  const sRes = await fetch(sampleUrl, { method: 'HEAD' });
  console.log(`[samples] ${sampleUrl} -> Status: ${sRes.status}`);
}

async function main() {
  await testUrls('18611590', '481', '13d64dcbbe07a48b0a29692bf2f75fe9');
  await testUrls('18611599', '481', '8a8faa52537b7b9d78ad34300ac66d15');
  await testUrls('18611591', '481', 'a2ee9137ec33e5c31604b93c4ddf2bac');
  await testUrls('18611727', '481', 'cf64169e6fa9f2a0a846f242efe3595c');
}

main();
