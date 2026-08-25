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
  try {
    execSync('git commit -m "Fix browser disk cache poisoning: prevent caching error responses and use cache-busting retry nonce"', { stdio: 'inherit' });
  } catch (e) {}
  execSync('git pull --rebase origin main', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✔ Successfully pushed cache poisoning fix to https://github.com/lalaliwe/goonscroll');
} catch (err) {
  console.error('Git error:', err.message);
  process.exit(1);
}
