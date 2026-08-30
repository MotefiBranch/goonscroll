import dotenv from 'dotenv';
dotenv.config();

const token = process.env.WORKFLOW_TOKEN || process.env.GITHUB_TOKEN;

async function checkJobs() {
  const jobsRes = await fetch('https://api.github.com/repos/lalaliwe/goonscroll/actions/runs/33341757445/jobs', {
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
      console.log(`- Step [${s.name}]: ${s.conclusion} (status: ${s.status})`);
    }
  }
}

checkJobs();
