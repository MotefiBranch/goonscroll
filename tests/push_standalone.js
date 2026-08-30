import { execSync } from 'child_process';
import dotenv from 'dotenv';
dotenv.config();

const token = process.env.WORKFLOW_TOKEN || process.env.GITHUB_TOKEN;
if (!token) {
  console.error('Missing token');
  process.exit(1);
}

try {
  execSync('git add .', { stdio: 'inherit' });
  try {
    execSync('git commit -m "Bundle client-side Booru adapter engine for standalone iOS execution without server"', { stdio: 'inherit' });
  } catch (e) {}
  
  const remoteUrl = `https://lalaliwe:${token}@github.com/lalaliwe/goonscroll.git`;
  execSync(`git pull --rebase "${remoteUrl}" main`, { stdio: 'inherit' });
  execSync(`git push "${remoteUrl}" main`, { stdio: 'inherit' });
  console.log('✔ Successfully pushed standalone booru client to https://github.com/lalaliwe/goonscroll');
} catch (err) {
  console.error('Git error:', err.message);
  process.exit(1);
}
