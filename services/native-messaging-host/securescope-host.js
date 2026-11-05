#!/usr/bin/env node
/**
 * SecureScope — Windows Native Messaging Host Launcher
 * 
 * Proxies to compiled Electron main service or loads compiled entry point.
 */
const path = require('path');
const fs = require('fs');

const compiledPath = path.resolve(__dirname, '../../dist-electron/main/services/native-host/securescope-host.js');

if (fs.existsSync(compiledPath)) {
  require(compiledPath);
} else {
  // If running before full build, fallback or report error
  process.stderr.write(`SecureScope Native Host: compiled service not found at ${compiledPath}. Please run npm run build first.\n`);
  process.exit(1);
}

