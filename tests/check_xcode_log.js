import dotenv from 'dotenv';
dotenv.config();

const token = process.env.WORKFLOW_TOKEN || process.env.GITHUB_TOKEN;

async function checkXcodeBuildError() {
  const jobsRes = await fetch('https://api.github.com/repos/lalaliwe/goonscroll/actions/runs/33340144013/jobs', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GoonScroll-CI'
    }
  });

  if (jobsRes.ok) {
    const data = await jobsRes.json();
    const job = data.jobs[0];
    const logRes = await fetch(`https://api.github.com/repos/lalaliwe/goonscroll/actions/jobs/${job.id}/logs`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'GoonScroll-CI'
      }
    });
    if (logRes.ok) {
      const logText = await logRes.text();
      const lines = logText.split('\n');
      console.log('--- Xcode Error Log (Last 60 lines) ---');
      console.log(lines.slice(Math.max(0, lines.length - 60)).join('\n'));
    }
  }
}

checkXcodeBuildError();
