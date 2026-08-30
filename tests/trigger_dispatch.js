import dotenv from 'dotenv';
dotenv.config();

const token = process.env.WORKFLOW_TOKEN || process.env.GITHUB_TOKEN;

async function triggerWorkflow() {
  const res = await fetch('https://api.github.com/repos/lalaliwe/goonscroll/actions/workflows/build-ios.yml/dispatches', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'GoonScroll-CI',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ref: 'main' })
  });
  console.log('Dispatch trigger response:', res.status, res.statusText);
}

triggerWorkflow();
