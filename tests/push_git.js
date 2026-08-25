import { execSync } from 'child_process';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error('Missing GITHUB_TOKEN');
  process.exit(1);
}

try {
  execSync('git init', { stdio: 'inherit' });
  execSync('git config user.name "lalaliwe"', { stdio: 'inherit' });
  execSync('git config user.email "lalaliwe@users.noreply.github.com"', { stdio: 'inherit' });
  execSync('git branch -M main', { stdio: 'inherit' });
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "Initial release: GoonScroll fullstack booru aggregator with PWA and Termux support"', { stdio: 'inherit' });

  const remoteUrl = `https://${token}@github.com/lalaliwe/goonscroll.git`;
  try {
    execSync(`git remote add origin "${remoteUrl}"`, { stdio: 'ignore' });
  } catch (e) {
    execSync(`git remote set-url origin "${remoteUrl}"`, { stdio: 'ignore' });
  }

  console.log('Pushing to GitHub main...');
  execSync('git push -u origin main --force', { stdio: 'inherit' });
  console.log('✔ Successfully pushed to https://github.com/lalaliwe/goonscroll');
} catch (err) {
  console.error('Git error:', err.message);
  process.exit(1);
}
