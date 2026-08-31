import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const match = envContent.match(/GITHUB_TOKEN=([a-zA-Z0-9_]+)/g);
const token = match ? match[match.length - 1].replace('GITHUB_TOKEN=', '') : process.env.GITHUB_TOKEN;

async function checkXcodeCompileErrors() {
  const jobsRes = await fetch('https://api.github.com/repos/MotefiBranch/goonscroll/actions/runs/33344594352/jobs', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GoonScroll-CI'
    }
  });
  if (jobsRes.ok) {
    const data = await jobsRes.json();
    const job = data.jobs[0];
    const logRes = await fetch(`https://api.github.com/repos/MotefiBranch/goonscroll/actions/jobs/${job.id}/logs`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'GoonScroll-CI'
      }
    });
    if (logRes.ok) {
      const text = await logRes.text();
      const errorLines = text.split('\n').filter(l => l.includes('error:') || l.includes('fatal error:'));
      console.log('Compile Errors:');
      console.log(errorLines.join('\n'));
    }
  }
}

checkXcodeCompileErrors();
