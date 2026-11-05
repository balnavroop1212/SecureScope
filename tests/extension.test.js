/**
 * SecureScope — Milestone 8 Chrome Extension & Native Messaging Test Suite
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Import compiled services from dist-electron
const { NativeFramer } = require('../dist-electron/main/services/native-host/NativeFramer');
const { NativeHostEngine } = require('../dist-electron/main/services/native-host/NativeHostEngine');
const { ExtensionRegistrationService } = require('../dist-electron/main/services/native-host/ExtensionRegistrationService');
const { LocalAuthRepository } = require('../dist-electron/main/services/auth/LocalAuthRepository');
const { SQLiteScanRepository } = require('../dist-electron/main/services/storage/SQLiteScanRepository');

async function runExtensionTestSuite() {
  console.log('====================================================');
  console.log('SecureScope — Milestone 8 Chrome Extension & Host Tests');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  // Use isolated temporary data dir for tests
  const testDataDir = path.join(__dirname, '.temp-ext-test-data');
  if (fs.existsSync(testDataDir)) {
    fs.rmSync(testDataDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testDataDir, { recursive: true });

  const authRepo = new LocalAuthRepository(testDataDir);
  const scanRepo = new SQLiteScanRepository(testDataDir);
  await scanRepo.initialize();

  // Test 1: NativeFramer binary wire protocol encoding & decoding
  try {
    process.stdout.write('• Testing: NativeFramer 32-bit LE encoding and multi-frame decoding... ');

    const payload1 = { type: 'PING', id: 101, text: 'Hello Chrome' };
    const payload2 = { type: 'GET_STATUS', id: 102 };

    const encoded1 = NativeFramer.encode(payload1);
    assert.strictEqual(encoded1.length, 4 + Buffer.byteLength(JSON.stringify(payload1), 'utf-8'));
    
    // Check little-endian length prefix
    const expectedLen = Buffer.byteLength(JSON.stringify(payload1), 'utf-8');
    assert.strictEqual(encoded1.readUInt32LE(0), expectedLen);

    const encoded2 = NativeFramer.encode(payload2);

    // Concatenate frames to simulate streaming input chunk
    const streamBuffer = Buffer.concat([encoded1, encoded2]);
    const { messages, remainder } = NativeFramer.decode(streamBuffer);

    assert.strictEqual(messages.length, 2);
    assert.strictEqual(messages[0].type, 'PING');
    assert.strictEqual(messages[0].id, 101);
    assert.strictEqual(messages[1].type, 'GET_STATUS');
    assert.strictEqual(messages[1].id, 102);
    assert.strictEqual(remainder.length, 0);

    // Test partial framing
    const partialSlice = encoded1.subarray(0, 10);
    const partialDecode = NativeFramer.decode(partialSlice);
    assert.strictEqual(partialDecode.messages.length, 0);
    assert.strictEqual(partialDecode.remainder.length, 10);

    console.log('PASSED ✅');
    passed++;
  } catch (err) {
    console.log('FAILED ❌');
    console.error(err);
    failed++;
  }

  // Test 2: ExtensionRegistrationService and echo verification
  try {
    process.stdout.write('• Testing: ExtensionRegistrationService wires host files and tests echo... ');

    const regResult = ExtensionRegistrationService.registerHost('abcdefghijklmnopabcdefghijklmnop');
    assert.strictEqual(regResult.success, true);
    assert.ok(fs.existsSync(regResult.manifestPath));
    assert.ok(fs.existsSync(regResult.batPath));

    const manifestContent = JSON.parse(fs.readFileSync(regResult.manifestPath, 'utf-8'));
    assert.strictEqual(manifestContent.name, 'com.securescope.desktop');
    assert.strictEqual(manifestContent.type, 'stdio');
    assert.ok(manifestContent.allowed_origins.some(o => o.includes('abcdefghijklmnopabcdefghijklmnop')));

    const echoRes = ExtensionRegistrationService.testEcho({ test: 'roundtrip', ping: true });
    assert.strictEqual(echoRes.success, true);
    assert.strictEqual(echoRes.decoded.test, 'roundtrip');

    console.log('PASSED ✅');
    passed++;
  } catch (err) {
    console.log('FAILED ❌');
    console.error(err);
    failed++;
  }

  // Test 3: NativeHostEngine PING and unauthenticated status
  try {
    process.stdout.write('• Testing: NativeHostEngine handles PING and unauthenticated GET_STATUS... ');

    const hostEngine = new NativeHostEngine(testDataDir, scanRepo, authRepo);

    const pingRes = await hostEngine.handleMessage({ type: 'PING' });
    assert.strictEqual(pingRes.response.type, 'PONG');
    assert.strictEqual(pingRes.response.service, 'com.securescope.desktop');

    const statusRes = await hostEngine.handleMessage({ type: 'GET_STATUS' });
    assert.strictEqual(statusRes.response.type, 'STATUS_RESPONSE');
    assert.strictEqual(statusRes.response.connected, true);
    assert.strictEqual(statusRes.response.authenticated, false);
    assert.strictEqual(statusRes.response.canScan, false);

    console.log('PASSED ✅');
    passed++;
  } catch (err) {
    console.log('FAILED ❌');
    console.error(err);
    failed++;
  }

  // Test 4: NativeHostEngine entitlement enforcement (Free vs Premium)
  try {
    process.stdout.write('• Testing: NativeHostEngine enforces Pro subscription for scans... ');

    const hostEngine = new NativeHostEngine(testDataDir, scanRepo, authRepo);

    // Register Free user and log them in
    const freeUserRes = await authRepo.register({
      firstName: 'Free',
      lastName: 'Tester',
      email: 'free.ext@securescope.test',
      password: 'SecurePassword123!',
      confirmPassword: 'SecurePassword123!',
      authorizedScopeConsent: true,
    });
    await authRepo.saveSession({
      userId: freeUserRes.user.id,
      email: freeUserRes.user.email,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });

    // Check status as Free user
    const freeStatus = await hostEngine.handleMessage({ type: 'GET_STATUS' });
    assert.strictEqual(freeStatus.response.authenticated, true);
    assert.strictEqual(freeStatus.response.user.plan, 'free');
    assert.strictEqual(freeStatus.response.canScan, false); // Companion requires Pro

    // Attempt scan as Free user
    const freeScanRes = await hostEngine.handleMessage({
      type: 'START_SCAN',
      url: 'https://example.com',
      mode: 'normal',
      authorizedScopeConfirmed: true,
    });
    assert.strictEqual(freeScanRes.response.type, 'SCAN_ERROR');
    assert.strictEqual(freeScanRes.response.upgradeRequired, true);

    // Upgrade user to Pro
    await authRepo.updatePlan(freeUserRes.user.id, 'premium');

    // Re-check status as Pro user
    const proStatus = await hostEngine.handleMessage({ type: 'GET_STATUS' });
    assert.strictEqual(proStatus.response.authenticated, true);
    assert.strictEqual(proStatus.response.user.plan, 'premium');
    assert.strictEqual(proStatus.response.canScan, true); // Pro unlocked!

    console.log('PASSED ✅');
    passed++;
  } catch (err) {
    console.log('FAILED ❌');
    console.error(err);
    failed++;
  }

  // Test 5: NativeHostEngine SSRF blocking and authorized scan execution
  try {
    process.stdout.write('• Testing: NativeHostEngine blocks SSRF targets and assesses demo target... ');

    const hostEngine = new NativeHostEngine(testDataDir, scanRepo, authRepo);

    // SSRF attempt via Chrome extension
    const ssrfRes = await hostEngine.handleMessage({
      type: 'START_SCAN',
      url: 'http://169.254.169.254/latest/meta-data/',
      mode: 'normal',
      authorizedScopeConfirmed: true,
    });
    assert.strictEqual(ssrfRes.response.type, 'SCAN_ERROR');
    assert.ok(ssrfRes.response.error.toLowerCase().includes('ssrf') || ssrfRes.response.error.toLowerCase().includes('private'));

    // Authorized Demo assessment
    const scanRes = await hostEngine.handleMessage({
      type: 'START_SCAN',
      url: 'http://localhost:8080',
      mode: 'sandbox',
      isDemoMode: true,
      authorizedScopeConfirmed: true,
    });
    assert.strictEqual(scanRes.response.type, 'SCAN_COMPLETE');
    assert.strictEqual(scanRes.response.success, true);
    assert.ok(scanRes.response.score >= 0 && scanRes.response.score <= 100);
    assert.ok(['A', 'B', 'C', 'D', 'F'].includes(scanRes.response.grade));
    assert.strictEqual(scanRes.response.isDemo, true);
    assert.ok(scanRes.response.totalFindings > 0);

    // Verify report was persisted in SQLite
    const persistedReport = await scanRepo.getReportByScanId(scanRes.response.scanId);
    assert.ok(persistedReport);
    assert.strictEqual(persistedReport.scanId, scanRes.response.scanId);

    console.log('PASSED ✅');
    passed++;
  } catch (err) {
    console.log('FAILED ❌');
    console.error(err);
    failed++;
  }

  // Test 6: Chrome Extension Manifest V3 and Asset Completeness
  try {
    process.stdout.write('• Testing: Chrome Extension Manifest V3 schema and icon asset verification... ');

    const extDir = path.resolve(__dirname, '../apps/chrome-extension');
    const manifestPath = path.join(extDir, 'manifest.json');
    assert.ok(fs.existsSync(manifestPath), 'manifest.json missing');

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    assert.strictEqual(manifest.manifest_version, 3, 'Must be Manifest V3');
    assert.ok(manifest.permissions.includes('activeTab'), 'Must request activeTab');
    assert.ok(manifest.permissions.includes('nativeMessaging'), 'Must request nativeMessaging');

    // Verify popup and worker files
    assert.ok(fs.existsSync(path.join(extDir, manifest.action.default_popup)), 'Popup HTML missing');
    assert.ok(fs.existsSync(path.join(extDir, manifest.background.service_worker)), 'Background worker missing');

    // Verify icon assets
    ['16', '48', '128'].forEach(size => {
      const iconPath = path.join(extDir, manifest.icons[size]);
      assert.ok(fs.existsSync(iconPath), `Icon ${size} missing at ${iconPath}`);
    });

    console.log('PASSED ✅');
    passed++;
  } catch (err) {
    console.log('FAILED ❌');
    console.error(err);
    failed++;
  }

  // Cleanup test data directory
  if (fs.existsSync(testDataDir)) {
    fs.rmSync(testDataDir, { recursive: true, force: true });
  }

  console.log('\n====================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runExtensionTestSuite().catch((err) => {
  console.error('Test Suite encountered fatal error:', err);
  process.exit(1);
});
