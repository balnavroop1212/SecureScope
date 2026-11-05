const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

let viteProcess = null;
let electronProcess = null;

function waitForViteServer(url, timeout = 30000) {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    function check() {
      http
        .get(url, (res) => {
          if (res.statusCode === 200) {
            resolve();
          } else {
            retry();
          }
        })
        .on('error', () => {
          retry();
        });
    }

    function retry() {
      if (Date.now() - startTime > timeout) {
        reject(new Error(`Timed out waiting for Vite server at ${url}`));
      } else {
        setTimeout(check, 300);
      }
    }

    check();
  });
}

async function start() {
  console.log('[Dev] Compiling Electron main and preload scripts...');
  const tsc = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['tsc', '-p', 'apps/desktop/tsconfig.electron.json'],
    { stdio: 'inherit' }
  );

  await new Promise((resolve, reject) => {
    tsc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`TypeScript compilation failed with code ${code}`));
    });
  });

  console.log('[Dev] Starting Vite dev server...');
  viteProcess = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['vite', '--config', 'apps/desktop/vite.config.ts'],
    { stdio: 'inherit' }
  );

  await waitForViteServer('http://localhost:5173');
  console.log('[Dev] Vite dev server ready on http://localhost:5173');

  console.log('[Dev] Launching Electron...');
  const electronEnv = { ...process.env, NODE_ENV: 'development' };
  delete electronEnv.ELECTRON_RUN_AS_NODE;

  electronProcess = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['electron', '.'],
    {
      stdio: 'inherit',
      env: electronEnv,
    }
  );

  electronProcess.on('close', (code) => {
    console.log(`[Dev] Electron exited with code ${code}`);
    cleanup();
    process.exit(code || 0);
  });
}

function cleanup() {
  if (viteProcess) {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', viteProcess.pid.toString(), '/f', '/t']);
      } else {
        viteProcess.kill();
      }
    } catch (e) {
      // Ignore cleanup error
    }
  }
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

start().catch((err) => {
  console.error('[Dev] Startup error:', err);
  cleanup();
  process.exit(1);
});
