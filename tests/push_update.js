import { execSync } from 'child_process';
import dotenv from 'dotenv';
dotenv.config();

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error('Missing GITHUB_TOKEN');
  process.exit(1);
}

try {
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "Add GitHub Gist Cloud Sync and updated production build"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✔ Successfully pushed updates to https://github.com/lalaliwe/goonscroll');
} catch (err) {
  console.error('Git error:', err.message);
  process.exit(1);
}
