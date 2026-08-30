import dotenv from 'dotenv';
dotenv.config();

const token = process.env.WORKFLOW_TOKEN || process.env.GITHUB_TOKEN;

async function checkJobs() {
  const res = await fetch('https://api.github.com/repos/lalaliwe/goonscroll/actions/runs/33341698728', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GoonScroll-CI'
    }
  });
  if (res.ok) {
    const data = await res.json();
    console.log('Run details:', data.status, data.conclusion);
  }
  
  const jobsRes = await fetch('https://api.github.com/repos/lalaliwe/goonscroll/actions/runs/33341698728/jobs', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GoonScroll-CI'
    }
  });
  if (jobsRes.ok) {
    const data = await jobsRes.json();
    console.log('Jobs:', data.jobs.map(j => ({ id: j.id, name: j.name, status: j.status, conclusion: j.conclusion, steps: j.steps })));
  }
}

checkJobs();
