import dotenv from 'dotenv';
dotenv.config();

const token = process.env.WORKFLOW_TOKEN || process.env.GITHUB_TOKEN;

async function checkLog() {
  const logRes = await fetch(`https://api.github.com/repos/lalaliwe/goonscroll/actions/jobs/99338377017/logs`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'GoonScroll-CI'
    }
  });
  if (logRes.ok) {
    const text = await logRes.text();
    console.log(text.slice(-1000));
  } else {
    console.log('Log fetch status:', logRes.status);
    console.log('Location header:', logRes.headers.get('location'));
  }
}

checkLog();
