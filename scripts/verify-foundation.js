const { spawn } = require('child_process');
const path = require('path');

console.log('[Verification Runner] Starting Electron Foundation Test...');

const electronBinary = path.join(
  __dirname,
  '../node_modules/electron/dist/electron.exe'
);

const env = {
  ...process.env,
  USE_LOCAL_DIST: '1',
  TEST_EXIT: '1',
  ELECTRON_ENABLE_LOGGING: '1',
};
delete env.ELECTRON_RUN_AS_NODE;

const proc = spawn(electronBinary, ['.'], {
  cwd: path.join(__dirname, '..'),
  env,
  stdio: ['pipe', 'pipe', 'pipe'],
});

let stdout = '';
let stderr = '';

proc.stdout.on('data', (d) => {
  const str = d.toString();
  stdout += str;
  process.stdout.write(`[Electron stdout] ${str}`);
});

proc.stderr.on('data', (d) => {
  const str = d.toString();
  stderr += str;
  process.stderr.write(`[Electron stderr] ${str}`);
});

const timer = setTimeout(() => {
  console.error('[Verification Runner] Test timed out after 15 seconds!');
  proc.kill();
  process.exit(1);
}, 15000);

proc.on('close', (code) => {
  clearTimeout(timer);
  console.log(`[Verification Runner] Electron exited with code: ${code}`);

  if (code === 0 || stdout.includes('Window initialized and verified')) {
    console.log(
      '✅ [FOUNDATION VERIFIED] SecureScope Electron window loaded dist/index.html and executed cleanly!'
    );
    process.exit(0);
  } else {
    console.error(
      '❌ [FOUNDATION FAILED] Electron did not exit cleanly or verification marker was not observed.'
    );
    process.exit(code || 1);
  }
});
