import dotenv from 'dotenv';
dotenv.config();

const token = process.env.WORKFLOW_TOKEN || process.env.GITHUB_TOKEN;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function monitorBuild() {
  console.log('Starting GitHub Actions Build Monitor...\n');
  
  let completed = false;
  let runId = null;
  
  while (!completed) {
    try {
      const res = await fetch('https://api.github.com/repos/lalaliwe/goonscroll/actions/runs', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'GoonScroll-CI'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        const latestRun = data.workflow_runs[0];
        runId = latestRun.id;
        
        console.log(`[${new Date().toLocaleTimeString()}] Status: ${latestRun.status}, Conclusion: ${latestRun.conclusion || 'Running...'}, URL: ${latestRun.html_url}`);
        
        if (latestRun.status === 'completed') {
          completed = true;
          if (latestRun.conclusion === 'success') {
            console.log('\n🎉 BUILD SUCCEEDED 100%!');
            
            // Check artifacts
            const artRes = await fetch(`https://api.github.com/repos/lalaliwe/goonscroll/actions/runs/${runId}/artifacts`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'GoonScroll-CI'
              }
            });
            if (artRes.ok) {
              const artData = await artRes.json();
              console.log('Artifacts uploaded:');
              for (const a of artData.artifacts) {
                console.log(`- ${a.name} (${Math.round(a.size_in_bytes / 1024 / 1024 * 10) / 10} MB)`);
              }
            }
          } else {
            console.log(`\n❌ Build finished with status: ${latestRun.conclusion}`);
            
            // Fetch error logs
            const jobsRes = await fetch(`https://api.github.com/repos/lalaliwe/goonscroll/actions/runs/${runId}/jobs`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'GoonScroll-CI'
              }
            });
            if (jobsRes.ok) {
              const jobsData = await jobsRes.json();
              for (const j of jobsData.jobs) {
                for (const s of j.steps) {
                  if (s.conclusion === 'failure') {
                    console.log(`Failed Step: ${s.name}`);
                  }
                }
              }
            }
          }
          break;
        }
      }
    } catch (err) {
      console.error('Polling error:', err.message);
    }
    
    await sleep(10000); // Poll every 10 seconds
  }
}

monitorBuild();
