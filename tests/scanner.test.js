const path = require('path');
const fs = require('fs');
const os = require('os');
const assert = require('assert');

// Import compiled backend modules from dist-electron
const { ScopeValidator } = require('../dist-electron/main/services/scanner/ScopeValidator');
const { EntitlementService } = require('../dist-electron/main/services/auth/EntitlementService');
const { ScannerEngine } = require('../dist-electron/main/services/scanner/ScannerEngine');
const { SQLiteScanRepository } = require('../dist-electron/main/services/storage/SQLiteScanRepository');
const { HeadersCheck } = require('../dist-electron/main/services/scanner/checks/HeadersCheck');

async function runScannerTests() {
  console.log('====================================================');
  console.log('SecureScope — Milestones 4 & 5 Scanner Test Suite');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      process.stdout.write(`• Testing: ${name}... `);
      await fn();
      console.log('PASSED ✅');
      passed++;
    } catch (err) {
      console.log('FAILED ❌');
      console.error('  Error:', err.message);
      failed++;
    }
  }

  // TEST 1: Scope Validation & SSRF Guard
  await test('ScopeValidator blocks SSRF private and loopback targets by default', async () => {
    // 127.0.0.1 in external mode must be rejected
    await assert.rejects(
      async () => {
        await ScopeValidator.validateScope('http://127.0.0.1:8080', false);
      },
      /SSRF Protection Guard/,
      'Must reject 127.0.0.1'
    );

    // 192.168.1.1 private IP must be rejected
    await assert.rejects(
      async () => {
        await ScopeValidator.validateScope('http://192.168.1.1', false);
      },
      /SSRF Protection Guard/,
      'Must reject private IP'
    );

    // 169.254.169.254 AWS metadata link-local must be rejected
    await assert.rejects(
      async () => {
        await ScopeValidator.validateScope('http://169.254.169.254/latest/meta-data', false);
      },
      /SSRF Protection Guard/,
      'Must reject link-local'
    );
  });

  // TEST 2: Demo Mode Sandbox Exception
  await test('ScopeValidator permits loopback exclusively in Sandbox Demo Mode with isDemo flag', async () => {
    const scope = await ScopeValidator.validateScope('http://localhost:8000', true);
    assert.strictEqual(scope.isDemo, true, 'isDemo flag must be true');
    assert.strictEqual(scope.hostname, 'localhost', 'Hostname must match');
    assert.strictEqual(scope.port, 8000, 'Port must be 8000');
  });

  // TEST 3: Entitlement & Feature Gating Enforcement
  await test('EntitlementService enforces plan restrictions at Main Process level', async () => {
    // Free plan
    assert.strictEqual(EntitlementService.canExecuteScanMode('free', 'normal'), true, 'Free can run normal');
    assert.strictEqual(EntitlementService.canExecuteScanMode('free', 'aggressive'), false, 'Free cannot run aggressive');
    assert.strictEqual(EntitlementService.canExecuteScanMode('free', 'private'), false, 'Free cannot run private');
    assert.strictEqual(EntitlementService.canDownloadPdf('free'), false, 'Free cannot download PDF');

    // Premium plan
    assert.strictEqual(EntitlementService.canExecuteScanMode('premium', 'normal'), true, 'Premium can run normal');
    assert.strictEqual(EntitlementService.canExecuteScanMode('premium', 'aggressive'), true, 'Premium can run aggressive');
    assert.strictEqual(EntitlementService.canExecuteScanMode('premium', 'private'), true, 'Premium can run private');
    assert.strictEqual(EntitlementService.canDownloadPdf('premium'), true, 'Premium can download PDF');
  });

  // TEST 4: Passive HTTP Headers Inspection Logic
  await test('HeadersCheck correctly identifies missing HSTS, CSP, and X-Frame-Options', async () => {
    // Test with missing headers
    const emptyHeaders = {};
    const res = HeadersCheck.execute(emptyHeaders, 'https://test-site.local', 'scn_test');

    const hstsFinding = res.findings.find((f) => f.title.includes('Missing HTTP Strict Transport Security'));
    const cspFinding = res.findings.find((f) => f.title.includes('Missing Content Security Policy'));
    const xfoFinding = res.findings.find((f) => f.title.includes('Missing Anti-Clickjacking Protection'));

    assert(hstsFinding, 'Must identify missing HSTS');
    assert.strictEqual(hstsFinding.severity, 'HIGH', 'Missing HSTS severity must be HIGH');
    assert(cspFinding, 'Must identify missing CSP');
    assert(xfoFinding, 'Must identify missing XFO');
  });

  // TEST 5: Full Assessment Pipeline Execution & SQLite Storage
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'securescope-scanner-test-'));
  const scanRepo = new SQLiteScanRepository(tempDir);
  await scanRepo.initialize();
  const engine = new ScannerEngine(scanRepo);

  await test('ScannerEngine executes pipeline, streams progress, and persists report', async () => {
    const progressEvents = [];
    const testUserId = 'usr_test_operator_123';

    const report = await engine.startScan({
      userId: testUserId,
      url: 'http://localhost:8000',
      scanMode: 'normal',
      authorizedScopeConfirmed: true,
      isDemoMode: true,
      onProgress: (prog) => {
        progressEvents.push(prog.stage);
      },
    });

    // Check report structure
    assert(report, 'Report must be generated');
    assert(report.id.startsWith('rep_'), 'Report ID must be rep_ prefixed');
    assert.strictEqual(report.scan.isDemo, true, 'Scan must be tagged isDemo');
    assert(report.findings.length > 0, 'Report must contain demo findings');
    assert(report.findings.every((f) => f.title.includes('[DEMO DATA]')), 'All findings must be tagged [DEMO DATA]');

    // Check progress stages progression
    assert(progressEvents.includes('Validating Target'), 'Must include Validating Target stage');
    assert(progressEvents.includes('Collecting Public Security Information'), 'Must include Collecting stage');
    assert(progressEvents.includes('Completed'), 'Must finish in Completed stage');

    // Verify persistence in SQLite
    const savedReport = await scanRepo.getReportByScanId(report.scanId);
    assert(savedReport, 'Report must be retrieved from SQLite');
    assert.strictEqual(savedReport.scanId, report.scanId, 'ScanId must match');
    assert.strictEqual(savedReport.findings.length, report.findings.length, 'Findings count must match');

    // Verify dynamic Dashboard metrics calculation
    const metrics = await scanRepo.getDashboardMetrics(testUserId);
    assert.strictEqual(metrics.totalScans, 1, 'Total scans must be 1');
    assert.strictEqual(metrics.uniqueWebsites, 1, 'Unique websites must be 1');
    assert(metrics.totalFindings >= 4, 'Total findings must be >= 4');
  });

  // TEST 6: Mandatory Scope Authorization Requirement
  await test('ScannerEngine rejects assessment if authorizedScopeConfirmed is false', async () => {
    await assert.rejects(
      async () => {
        await engine.startScan({
          userId: 'usr_test',
          url: 'http://localhost:8000',
          scanMode: 'normal',
          authorizedScopeConfirmed: false,
          isDemoMode: true,
        });
      },
      /Mandatory authorization declaration required/,
      'Must require authorization declaration'
    );
  });

  // Cleanup temp files
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {}

  console.log('\n====================================================');
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runScannerTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
