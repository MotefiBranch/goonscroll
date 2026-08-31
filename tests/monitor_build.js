import { execSync } from 'child_process';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const match = envContent.match(/GITHUB_TOKEN=([a-zA-Z0-9_]+)/g);
const token = match ? match[match.length - 1].replace('GITHUB_TOKEN=', '') : process.env.GITHUB_TOKEN;
const currentCommitSha = execSync('git rev-parse HEAD').toString().trim();

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function monitorBuild() {
  console.log(`Monitoring GitHub Actions build on MotefiBranch/goonscroll for commit: ${currentCommitSha.substring(0, 7)}...\n`);
  
  let targetRun = null;
  
  while (!targetRun) {
    try {
      const res = await fetch('https://api.github.com/repos/MotefiBranch/goonscroll/actions/runs?per_page=5', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'GoonScroll-CI'
        }
      });
      if (res.ok) {
        const data = await res.json();
        targetRun = data.workflow_runs.find(r => r.head_sha === currentCommitSha);
      }
    } catch (e) {}
    if (!targetRun) await sleep(3000);
  }
  
  console.log(`Found Run ID: ${targetRun.id} (${targetRun.html_url})`);
  
  let completed = false;
  while (!completed) {
    try {
      const res = await fetch(`https://api.github.com/repos/MotefiBranch/goonscroll/actions/runs/${targetRun.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'GoonScroll-CI'
        }
      });
      if (res.ok) {
        const run = await res.json();
        console.log(`[${new Date().toLocaleTimeString()}] Status: ${run.status}, Conclusion: ${run.conclusion || 'Building...'}`);
        
        if (run.status === 'completed') {
          completed = true;
          if (run.conclusion === 'success') {
            console.log('\n🎉 BUILD SUCCEEDED 100%!');
            
            const artRes = await fetch(`https://api.github.com/repos/MotefiBranch/goonscroll/actions/runs/${targetRun.id}/artifacts`, {
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
                console.log(`  Download URL: https://github.com/MotefiBranch/goonscroll/actions/runs/${targetRun.id}`);
              }
            }
          } else {
            console.log(`\n❌ Build failed with status: ${run.conclusion}`);
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

monitorBuild();
