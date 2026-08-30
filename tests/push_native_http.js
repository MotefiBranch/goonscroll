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
    execSync('git commit -m "Add native Swift URLSession plugin NativeHttp to bypass WebKit CORS on iOS"', { stdio: 'inherit' });
  } catch (e) {}
  
  const remoteUrl = `https://lalaliwe:${token}@github.com/lalaliwe/goonscroll.git`;
  execSync(`git pull --rebase "${remoteUrl}" main`, { stdio: 'inherit' });
  execSync(`git push "${remoteUrl}" main`, { stdio: 'inherit' });
  console.log('✔ Successfully pushed NativeHttp Swift plugin to https://github.com/lalaliwe/goonscroll');
} catch (err) {
  console.error('Git error:', err.message);
  process.exit(1);
}
