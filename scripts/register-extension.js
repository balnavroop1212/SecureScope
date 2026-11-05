/**
 * SecureScope — Windows Chrome Native Messaging Host Registration Script
 * 
 * Sets up host manifest, batch launcher, and Windows Registry keys
 * in HKCU\Software\Google\Chrome\NativeMessagingHosts\com.securescope.desktop
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function registerNativeHost(extensionId) {
  const isWindows = process.platform === 'win32';
  const appData = process.env.APPDATA || path.join(process.env.USERPROFILE || 'C:\\', 'AppData', 'Roaming');
  const hostDir = path.join(appData, 'SecureScope', 'host');

  if (!fs.existsSync(hostDir)) {
    fs.mkdirSync(hostDir, { recursive: true });
  }

  const projectRoot = path.resolve(__dirname, '..');
  const hostJsPath = path.join(projectRoot, 'services', 'native-messaging-host', 'securescope-host.js');

  // 1. Create Windows batch launcher
  const batPath = path.join(hostDir, 'securescope-host.bat');
  const batContent = `@echo off\r\nnode "${hostJsPath}"\r\n`;
  fs.writeFileSync(batPath, batContent, 'utf-8');

  // 2. Allowed origins
  const origins = [
    'chrome-extension://*/*',
  ];
  if (extensionId && extensionId.trim()) {
    origins.unshift(`chrome-extension://${extensionId.trim()}/`);
  }

  // 3. Create host manifest JSON
  const manifestPath = path.join(hostDir, 'com.securescope.desktop.json');
  const manifest = {
    name: 'com.securescope.desktop',
    description: 'SecureScope Desktop Native Messaging Host',
    path: batPath,
    type: 'stdio',
    allowed_origins: origins,
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  let registryStatus = 'Skipped (Non-Windows platform)';
  if (isWindows) {
    try {
      const regKey = 'HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.securescope.desktop';
      const cmd = `reg add "${regKey}" /ve /t REG_SZ /d "${manifestPath}" /f`;
      execSync(cmd, { stdio: 'pipe' });
      registryStatus = 'Registered in Windows Registry successfully';
    } catch (err) {
      registryStatus = `Registry update failed: ${err.message}`;
    }
  }

  return {
    success: true,
    hostDir,
    batPath,
    manifestPath,
    registryStatus,
  };
}

function checkNativeHostStatus() {
  const isWindows = process.platform === 'win32';
  const appData = process.env.APPDATA || path.join(process.env.USERPROFILE || 'C:\\', 'AppData', 'Roaming');
  const hostDir = path.join(appData, 'SecureScope', 'host');
  const manifestPath = path.join(hostDir, 'com.securescope.desktop.json');
  const batPath = path.join(hostDir, 'securescope-host.bat');

  const manifestExists = fs.existsSync(manifestPath);
  const batExists = fs.existsSync(batPath);
  let registryKeyExists = false;

  if (isWindows) {
    try {
      const regKey = 'HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\com.securescope.desktop';
      const output = execSync(`reg query "${regKey}"`, { stdio: 'pipe' }).toString();
      registryKeyExists = output.includes(manifestPath) || output.includes('com.securescope.desktop');
    } catch {
      registryKeyExists = false;
    }
  }

  return {
    isWindows,
    manifestExists,
    batExists,
    registryKeyExists,
    hostDir,
    manifestPath,
    isFullyConfigured: manifestExists && batExists && (!isWindows || registryKeyExists),
  };
}

if (require.main === module) {
  const targetExtensionId = process.argv[2];
  console.log('Registering SecureScope Chrome Native Messaging Host...');
  const result = registerNativeHost(targetExtensionId);
  console.log('Result:', result);
  const status = checkNativeHostStatus();
  console.log('Status Check:', status);
}

module.exports = {
  registerNativeHost,
  checkNativeHostStatus,
};
