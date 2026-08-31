async function inspect(id) {
  const url = `https://rule34.xxx/index.php?page=post&s=view&id=${id}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
  });
  const html = await res.text();
  
  const imgMatch = html.match(/<img[^>]+id="image"[^>]+src="([^"]+)"/i) || html.match(/<img[^>]+src="([^"]+)"[^>]+id="image"/i);
  const videoMatch = html.match(/<video[^>]+src="([^"]+)"/i) || html.match(/<source[^>]+src="([^"]+)"/i);
  const tagMatches = [...html.matchAll(/class="tag-type-[^"]*"[^>]*><a[^>]*>([^<]+)<\/a>/g)].map(m => m[1]);
  const sizeMatch = html.match(/Size: ([^<]+)/i);
  const typeMatch = html.match(/<a[^>]+href="([^"]+)"[^>]*>Original image<\/a>/i) || html.match(/<a[^>]+href="([^"]+)"[^>]*>Original video<\/a>/i);

  console.log(`\n=== Post ${id} ===`);
  console.log('Image src:', imgMatch ? imgMatch[1] : 'null');
  console.log('Video src:', videoMatch ? videoMatch[1] : 'null');
  console.log('Original link:', typeMatch ? typeMatch[1] : 'null');
  console.log('Size:', sizeMatch ? sizeMatch[1] : 'null');
  console.log('Tags (first 10):', tagMatches.slice(0, 10).join(', '));
}

async function main() {
  await inspect('18611749');
  await inspect('18604408');
}

main();
