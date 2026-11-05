/**
 * Tests the actual registered Windows Native Messaging Host batch process
 * by spawning it via stdio exactly as Google Chrome does.
 */

const assert = require('assert');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { NativeFramer } = require('../dist-electron/main/services/native-host/NativeFramer');

async function testNativeHostProcess() {
  console.log('• Testing: Spawning actual registered Windows host batch file via stdio...');

  const appData = process.env.APPDATA || path.join(process.env.USERPROFILE || 'C:\\', 'AppData', 'Roaming');
  const batPath = path.join(appData, 'SecureScope', 'host', 'securescope-host.bat');

  if (!fs.existsSync(batPath)) {
    throw new Error(`Batch launcher not found at ${batPath}`);
  }

  return new Promise((resolve, reject) => {
    const child = spawn(batPath, [], {
      stdio: ['pipe', 'pipe', 'inherit'],
      windowsHide: true,
      shell: true,
    });

    let stdoutBuffer = Buffer.alloc(0);

    child.stdout.on('data', (chunk) => {
      stdoutBuffer = Buffer.concat([stdoutBuffer, chunk]);
      
      try {
        const { messages, remainder } = NativeFramer.decode(stdoutBuffer);
        if (messages.length > 0) {
          const response = messages[0];
          assert.strictEqual(response.type, 'PONG');
          assert.strictEqual(response.service, 'com.securescope.desktop');
          assert.strictEqual(response.success, true);
          child.kill();
          console.log('PASSED ✅ (Native Host batch process executed and replied cleanly)');
          resolve();
        }
      } catch (err) {
        child.kill();
        reject(err);
      }
    });

    child.on('error', (err) => {
      reject(err);
    });

    child.on('exit', (code) => {
      if (stdoutBuffer.length === 0) {
        reject(new Error(`Native host exited prematurely with code ${code}`));
      }
    });

    // Send binary framed PING message to stdin
    const pingFrame = NativeFramer.encode({ type: 'PING' });
    child.stdin.write(pingFrame);
  });
}

testNativeHostProcess().catch((err) => {
  console.error('FAILED ❌', err);
  process.exit(1);
});
