import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const vite = spawn(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', '--prefix', 'app/renderer', 'dev'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' }
});

const electron = spawn(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['electron', path.join(__dirname, '../app/dist/main/index.js')],
  {
    stdio: 'inherit',
    env: { ...process.env, VITE_DEV_SERVER_URL: 'http://localhost:5173' }
  }
);

function cleanup() {
  vite.kill();
  electron.kill();
}
process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
