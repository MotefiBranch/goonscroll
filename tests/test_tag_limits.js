async function testTagLimits() {
  const tenNegativeTags = '-yaoi -gay -bbc -scat -fart -cartoon_network -hyper_ass -cellulite -about_to_pop -male_only';
  
  // Yande.re with 10 tags:
  const resYande10 = await fetch(`https://yande.re/post.json?tags=${encodeURIComponent(tenNegativeTags)}&limit=5`);
  console.log('Yande.re with 10 negative tags status:', resYande10.status);
  
  // Yande.re with clean query (0 negative tags):
  const resYandeClean = await fetch(`https://yande.re/post.json?tags=&limit=5`);
  console.log('Yande.re with clean query status:', resYandeClean.status, 'Items:', (await resYandeClean.json()).length);

  // Danbooru with 10 tags:
  const resDan10 = await fetch(`https://danbooru.donmai.us/posts.json?tags=${encodeURIComponent(tenNegativeTags)}&limit=5`);
  console.log('Danbooru with 10 negative tags status:', resDan10.status);

  // Danbooru with 1 tag:
  const resDanClean = await fetch(`https://danbooru.donmai.us/posts.json?tags=&limit=5`);
  console.log('Danbooru with clean query status:', resDanClean.status);
}

testTagLimits();
