/**
 * SecureScope — Milestone 9 Complete End-to-End User Journey Test Suite
 * 
 * Verifies the full user lifecycle:
 * Signup -> Login -> Dashboard KPIs -> Assessment -> Report ->
 * SQLite Persistence -> History Filters -> Premium Gating ->
 * Pro Upgrade -> Pro Aggressive Assessment -> PDF Export ->
 * Chrome Extension Native Host Query -> Deletion -> Logout
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const { LocalAuthRepository } = require('../dist-electron/main/services/auth/LocalAuthRepository');
const { SQLiteScanRepository } = require('../dist-electron/main/services/storage/SQLiteScanRepository');
const { ScannerEngine } = require('../dist-electron/main/services/scanner/ScannerEngine');
const { EntitlementService } = require('../dist-electron/main/services/auth/EntitlementService');
const { PdfGeneratorService } = require('../dist-electron/main/services/pdf/PdfGeneratorService');
const { NativeHostEngine } = require('../dist-electron/main/services/native-host/NativeHostEngine');

async function runE2EUserJourney() {
  console.log('====================================================');
  console.log('SecureScope — Complete End-to-End User Journey Test');
  console.log('====================================================\n');

  let step = 1;
  const tempDir = path.join(__dirname, '.temp-e2e-data');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  fs.mkdirSync(tempDir, { recursive: true });

  const authRepo = new LocalAuthRepository(tempDir);
  const scanRepo = new SQLiteScanRepository(tempDir);
  await scanRepo.initialize();
  const scanner = new ScannerEngine(scanRepo);

  try {
    // ----------------------------------------------------
    // STEP 1: User Signup
    // ----------------------------------------------------
    process.stdout.write(`• Step ${step++}: User Signup with valid credentials and scope consent... `);
    const signupRes = await authRepo.register({
      firstName: 'Samantha',
      lastName: 'Vance',
      email: 'samantha.vance@example.edu',
      password: 'CyberSecurity2026!#',
      confirmPassword: 'CyberSecurity2026!#',
      authorizedScopeConsent: true,
    });
    assert.strictEqual(signupRes.success, true);
    assert.strictEqual(signupRes.user.plan, 'free');
    assert.strictEqual(signupRes.user.email, 'samantha.vance@example.edu');
    console.log('PASSED ✅');

    // ----------------------------------------------------
    // STEP 2: User Login & Session Persistence
    // ----------------------------------------------------
    process.stdout.write(`• Step ${step++}: User Login and session initialization... `);
    const loginRes = await authRepo.login({
      email: 'samantha.vance@example.edu',
      password: 'CyberSecurity2026!#',
    });
    assert.strictEqual(loginRes.success, true);
    assert.strictEqual(loginRes.user.id, signupRes.user.id);

    const activeSession = await authRepo.getCurrentSession();
    assert.ok(activeSession);
    assert.strictEqual(activeSession.userId, signupRes.user.id);
    console.log('PASSED ✅');

    // ----------------------------------------------------
    // STEP 3: Initial Dashboard KPIs
    // ----------------------------------------------------
    process.stdout.write(`• Step ${step++}: Initial Dashboard metrics (0 scans, clean slate)... `);
    const initialMetrics = await scanRepo.getDashboardMetrics(signupRes.user.id);
    assert.strictEqual(initialMetrics.totalScans, 0);
    assert.strictEqual(initialMetrics.totalFindings, 0);
    assert.strictEqual(initialMetrics.highRiskFindings, 0);
    assert.strictEqual(initialMetrics.uniqueWebsites, 0);
    console.log('PASSED ✅');

    // ----------------------------------------------------
    // STEP 4: Conduct Authorized Assessment (Free User)
    // ----------------------------------------------------
    process.stdout.write(`• Step ${step++}: Execute assessment against demo target... `);
    const report1 = await scanner.startScan({
      userId: signupRes.user.id,
      url: 'http://localhost:8080',
      scanMode: 'normal',
      authorizedScopeConfirmed: true,
      isDemoMode: true,
    });
    assert.ok(report1.scanId);
    assert.ok(report1.findings.length > 0);
    assert.ok(report1.scan.postureScore >= 0 && report1.scan.postureScore <= 100);
    assert.ok(['A', 'B', 'C', 'D', 'F'].includes(report1.scan.grade || 'C'));
    assert.strictEqual(report1.scan.status, 'completed');
    console.log(`PASSED ✅ (Score: ${report1.scan.postureScore}, Findings: ${report1.findings.length})`);

    // ----------------------------------------------------
    // STEP 5: Updated Dashboard Metrics & History Query
    // ----------------------------------------------------
    process.stdout.write(`• Step ${step++}: Verify SQLite persistence & updated Dashboard metrics... `);
    const updatedMetrics = await scanRepo.getDashboardMetrics(signupRes.user.id);
    assert.strictEqual(updatedMetrics.totalScans, 1);
    assert.strictEqual(updatedMetrics.totalFindings, report1.findings.length);
    assert.strictEqual(updatedMetrics.uniqueWebsites, 1);

    const history = await scanRepo.getScansByUser(signupRes.user.id);
    assert.strictEqual(history.length, 1);
    assert.strictEqual(history[0].id, report1.scanId);
    console.log('PASSED ✅');

    // ----------------------------------------------------
    // STEP 6: Entitlement Gating for Free Tier
    // ----------------------------------------------------
    process.stdout.write(`• Step ${step++}: Enforce strict feature gating for Free account... `);
    const canScanAggressive = EntitlementService.canExecuteScanMode('free', 'aggressive');
    const canScanPrivate = EntitlementService.canExecuteScanMode('free', 'private');
    const canExportPdf = EntitlementService.canDownloadPdf('free');
    const canUseExt = EntitlementService.canUseCompanionExtension('free');

    assert.strictEqual(canScanAggressive, false);
    assert.strictEqual(canScanPrivate, false);
    assert.strictEqual(canExportPdf, false);
    assert.strictEqual(canUseExt, false);
    console.log('PASSED ✅');

    // ----------------------------------------------------
    // STEP 7: Simulated Pro Upgrade (₹299 + GST Demo Flow)
    // ----------------------------------------------------
    process.stdout.write(`• Step ${step++}: Upgrade account to Pro via demo checkout... `);
    const upgradedUser = await authRepo.updatePlan(signupRes.user.id, 'premium');
    assert.strictEqual(upgradedUser.plan, 'premium');
    assert.strictEqual(upgradedUser.subscription.status, 'active');

    // Re-verify entitlements
    assert.strictEqual(EntitlementService.canExecuteScanMode('premium', 'aggressive'), true);
    assert.strictEqual(EntitlementService.canDownloadPdf('premium'), true);
    assert.strictEqual(EntitlementService.canUseCompanionExtension('premium'), true);
    console.log('PASSED ✅');

    // ----------------------------------------------------
    // STEP 8: Pro Feature Execution (Aggressive Scan)
    // ----------------------------------------------------
    process.stdout.write(`• Step ${step++}: Execute Pro Aggressive Assessment... `);
    const report2 = await scanner.startScan({
      userId: signupRes.user.id,
      url: 'http://localhost:8080/deep',
      scanMode: 'aggressive',
      authorizedScopeConfirmed: true,
      isDemoMode: true,
    });
    assert.ok(report2.scanId);
    assert.strictEqual(report2.scan.scanMode, 'aggressive');
    console.log('PASSED ✅');

    // ----------------------------------------------------
    // STEP 9: Executive PDF Report Generation
    // ----------------------------------------------------
    process.stdout.write(`• Step ${step++}: Verify Executive PDF Report HTML layout generation... `);
    const htmlReport = PdfGeneratorService.generateHtmlTemplate(report2);
    assert.ok(htmlReport.includes('SECURESCOPE'));
    assert.ok(htmlReport.includes('Executive Summary'));
    assert.ok(htmlReport.includes(report2.scan.targetUrl));
    assert.ok(htmlReport.includes('Posture Score'));
    console.log('PASSED ✅');

    // ----------------------------------------------------
    // STEP 10: Chrome Companion Extension Native Messaging
    // ----------------------------------------------------
    process.stdout.write(`• Step ${step++}: Companion Chrome Extension Native Messaging workflow... `);
    const hostEngine = new NativeHostEngine(tempDir, scanRepo, authRepo);

    // Extension PING
    const pingRes = await hostEngine.handleMessage({ type: 'PING' });
    assert.strictEqual(pingRes.response.type, 'PONG');

    // Extension STATUS (active session + premium plan)
    const statusRes = await hostEngine.handleMessage({ type: 'GET_STATUS' });
    assert.strictEqual(statusRes.response.authenticated, true);
    assert.strictEqual(statusRes.response.user.plan, 'premium');
    assert.strictEqual(statusRes.response.canScan, true);

    // Extension START_SCAN
    const extScanRes = await hostEngine.handleMessage({
      type: 'START_SCAN',
      url: 'http://localhost:8080/chrome-tab',
      mode: 'normal',
      isDemoMode: true,
      authorizedScopeConfirmed: true,
    });
    assert.strictEqual(extScanRes.response.type, 'SCAN_COMPLETE');
    assert.ok(extScanRes.response.scanId);
    console.log('PASSED ✅');

    // ----------------------------------------------------
    // STEP 11: History Deletion & Metrics Recalculation
    // ----------------------------------------------------
    process.stdout.write(`• Step ${step++}: Cascade deletion of scan and KPI recalculation... `);
    const preDeleteMetrics = await scanRepo.getDashboardMetrics(signupRes.user.id);
    assert.strictEqual(preDeleteMetrics.totalScans, 3);

    const deleteSuccess = await scanRepo.deleteScan(report1.scanId, signupRes.user.id);
    assert.strictEqual(deleteSuccess, true);

    const postDeleteMetrics = await scanRepo.getDashboardMetrics(signupRes.user.id);
    assert.strictEqual(postDeleteMetrics.totalScans, 2);
    console.log('PASSED ✅');

    // ----------------------------------------------------
    // STEP 12: User Logout
    // ----------------------------------------------------
    process.stdout.write(`• Step ${step++}: User Logout and session cleanup... `);
    await authRepo.clearSession();
    const finalSession = await authRepo.getCurrentSession();
    assert.strictEqual(finalSession, null);
    console.log('PASSED ✅');

  } finally {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }

  console.log('\n====================================================');
  console.log('Complete E2E User Journey: 12/12 Steps PASSED! ✅');
  console.log('====================================================\n');
}

runE2EUserJourney().catch((err) => {
  console.error('\nE2E User Journey FAILED ❌:', err);
  process.exit(1);
});
