import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const match = envContent.match(/GITHUB_TOKEN=([a-zA-Z0-9_]+)/g);
const token = match ? match[match.length - 1].replace('GITHUB_TOKEN=', '') : process.env.GITHUB_TOKEN;

async function checkJobs() {
  const jobsRes = await fetch('https://api.github.com/repos/MotefiBranch/goonscroll/actions/runs/33344439895/jobs', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GoonScroll-CI'
    }
  });
  if (jobsRes.ok) {
    const data = await jobsRes.json();
    const job = data.jobs[0];
    console.log('Job:', job.name, job.conclusion);
    for (const s of job.steps) {
      console.log(`- Step [${s.name}]: ${s.conclusion}`);
    }
    
    // Fetch logs
    const logRes = await fetch(`https://api.github.com/repos/MotefiBranch/goonscroll/actions/jobs/${job.id}/logs`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'GoonScroll-CI'
      }
    });
    if (logRes.ok) {
      const text = await logRes.text();
      const lines = text.split('\n');
      console.log('--- Xcode Build Error (Last 30 lines) ---');
      console.log(lines.slice(Math.max(0, lines.length - 30)).join('\n'));
    }
  }
}

checkJobs();
