async function inspect(id) {
  const url = `https://rule34.xxx/index.php?page=post&s=view&id=${id}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    },
  });
  const html = await res.text();
  
  const imgMatch = html.match(/<img[^>]+id="image"[^>]+src="([^"]+)"/i) || html.match(/<img[^>]+src="([^"]+)"[^>]+id="image"/i);
  const origMatch = html.match(/<a[^>]+href="([^"]+)"[^>]*>Original image<\/a>/i);
  const resizeMatch = html.match(/<a[^>]+href="([^"]+)"[^>]*>Resize image<\/a>/i);
  const sizeMatch = html.match(/Size: ([^<]+)/i);

  console.log(`\n=== Post ${id} ===`);
  console.log('Image src:', imgMatch ? imgMatch[1] : 'null');
  console.log('Original link:', origMatch ? origMatch[1] : 'null');
  console.log('Resize link:', resizeMatch ? resizeMatch[1] : 'null');
  console.log('Size:', sizeMatch ? sizeMatch[1] : 'null');

  // Let's test the thumbnail link on the post page or search list
  const thumbMatch = html.match(/https?:\/\/[^"']+\/thumbnails\/[^"']+/i);
  console.log('Thumb link:', thumbMatch ? thumbMatch[0] : 'null');
}

inspect('18610649');
