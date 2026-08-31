import { execSync } from 'child_process';
import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const match = envContent.match(/GITHUB_TOKEN=([a-zA-Z0-9_]+)/g);
const token = match ? match[match.length - 1].replace('GITHUB_TOKEN=', '') : process.env.GITHUB_TOKEN;

if (!token) {
  console.error('Missing token');
  process.exit(1);
}

try {
  execSync('git add .', { stdio: 'inherit' });
  execSync('git commit -m "Prevent recursive fetch loop and stack overflow in universalFetch"', { stdio: 'inherit' });
  
  const remoteUrl = `https://MotefiBranch:${token}@github.com/MotefiBranch/goonscroll.git`;
  console.log('Pushing to MotefiBranch/goonscroll...');
  execSync(`git push "${remoteUrl}" main`, { stdio: 'inherit' });
  console.log('✔ Successfully pushed recursion fix to MotefiBranch/goonscroll!');
} catch (err) {
  console.error('Git error:', err.message);
  process.exit(1);
}
