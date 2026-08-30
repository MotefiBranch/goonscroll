import dotenv from 'dotenv';
dotenv.config();

const token = process.env.WORKFLOW_TOKEN || process.env.GITHUB_TOKEN;

async function checkJobFailure() {
  const jobsRes = await fetch('https://api.github.com/repos/lalaliwe/goonscroll/actions/runs/33340079226/jobs', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GoonScroll-CI'
    }
  });

  if (jobsRes.ok) {
    const data = await jobsRes.json();
    for (const job of data.jobs) {
      console.log(`Job: ${job.name} (Status: ${job.status}, Conclusion: ${job.conclusion})`);
      for (const step of job.steps) {
        console.log(`  - Step: ${step.name} (Conclusion: ${step.conclusion})`);
      }
      
      if (job.conclusion === 'failure') {
        // Fetch job log
        const logRes = await fetch(`https://api.github.com/repos/lalaliwe/goonscroll/actions/jobs/${job.id}/logs`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': 'GoonScroll-CI'
          }
        });
        if (logRes.ok) {
          const logText = await logRes.text();
          console.log('\n--- Error Log Tail (Last 40 lines) ---');
          const lines = logText.split('\n');
          console.log(lines.slice(Math.max(0, lines.length - 50)).join('\n'));
        }
      }
    }
  } else {
    console.error('Failed to get jobs:', jobsRes.status, await jobsRes.text());
  }
}

checkJobFailure();
