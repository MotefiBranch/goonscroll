import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testFiles = [
  'storage.test.js',
  'adapters.test.js',
  'server.test.js',
  'e2e.test.js'
];

async function runAll() {
  console.log('Running full test suite...\n========================================');
  for (const file of testFiles) {
    const filePath = path.join(__dirname, file);
    console.log(`\n▶ Running ${file}...`);
    await new Promise((resolve, reject) => {
      const child = spawn('node', [filePath], { stdio: 'inherit' });
      child.on('close', code => {
        if (code === 0) resolve();
        else reject(new Error(`Test ${file} failed with exit code ${code}`));
      });
    });
  }
  console.log('\n========================================\n🎉 ALL TEST SUITES PASSED CLEANLY!\n');
}

runAll().catch(err => {
  console.error('\n❌ Test Suite Failure:', err.message);
  process.exit(1);
});
