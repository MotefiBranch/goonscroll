import dotenv from 'dotenv';
dotenv.config();

const token = process.env.WORKFLOW_TOKEN || process.env.GITHUB_TOKEN;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function monitorLatestRun() {
  console.log('Fetching latest workflow run...\n');
  await sleep(3000);
  
  let targetRun = null;
  const res = await fetch('https://api.github.com/repos/lalaliwe/goonscroll/actions/runs?per_page=1', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GoonScroll-CI'
    }
  });
  if (res.ok) {
    const data = await res.json();
    targetRun = data.workflow_runs[0];
  }
  
  if (!targetRun) {
    console.error('No run found');
    return;
  }
  
  console.log(`Monitoring Run ID: ${targetRun.id} (${targetRun.html_url})`);
  
  let completed = false;
  while (!completed) {
    try {
      const pollRes = await fetch(`https://api.github.com/repos/lalaliwe/goonscroll/actions/runs/${targetRun.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'GoonScroll-CI'
        }
      });
      if (pollRes.ok) {
        const run = await pollRes.json();
        console.log(`[${new Date().toLocaleTimeString()}] Status: ${run.status}, Conclusion: ${run.conclusion || 'Building...'}`);
        
        if (run.status === 'completed') {
          completed = true;
          if (run.conclusion === 'success') {
            console.log('\n🎉 BUILD SUCCEEDED 100%!');
            
            const artRes = await fetch(`https://api.github.com/repos/lalaliwe/goonscroll/actions/runs/${targetRun.id}/artifacts`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'GoonScroll-CI'
              }
            });
            if (artRes.ok) {
              const artData = await artRes.json();
              console.log('\n📦 Artifacts ready for download:');
              for (const a of artData.artifacts) {
                console.log(`- ${a.name} (${Math.round(a.size_in_bytes / 1024 / 1024 * 10) / 10} MB)`);
              }
            }
          } else {
            console.log(`\n❌ Build finished with conclusion: ${run.conclusion}`);
          }
          break;
        }
      }
    } catch (e) {
      console.error('Polling error:', e.message);
    }
    
    await sleep(7000);
  }
}

monitorLatestRun();
