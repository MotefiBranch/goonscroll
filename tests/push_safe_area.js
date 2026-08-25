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
  execSync('git commit -m "Fix mobile PWA safe-area-inset top clipping on search bar and tag drawer close button"', { stdio: 'inherit' });
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('✔ Successfully pushed PWA safe-area fix to https://github.com/lalaliwe/goonscroll');
} catch (err) {
  console.error('Git error:', err.message);
  process.exit(1);
}
