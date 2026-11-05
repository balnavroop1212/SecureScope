const path = require('path');
const fs = require('fs');
const os = require('os');
const assert = require('assert');

// Import compiled backend modules from dist-electron
const { LocalAuthRepository } = require('../dist-electron/main/services/auth/LocalAuthRepository');
const { EntitlementService } = require('../dist-electron/main/services/auth/EntitlementService');
const { SQLiteScanRepository } = require('../dist-electron/main/services/storage/SQLiteScanRepository');
const { PdfGeneratorService } = require('../dist-electron/main/services/pdf/PdfGeneratorService');

async function runPremiumHistoryTests() {
  console.log('====================================================');
  console.log('SecureScope — Milestones 6 & 7 Premium & History Tests');
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

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'securescope-m67-test-'));
  const authRepo = new LocalAuthRepository(tempDir);
  await authRepo.initialize();
  const scanRepo = new SQLiteScanRepository(tempDir);
  await scanRepo.initialize();

  // TEST 1: Free vs Premium Feature Gating
  await test('EntitlementService enforces strict feature gating for Free accounts', async () => {
    assert.strictEqual(EntitlementService.canExecuteScanMode('free', 'normal'), true);
    assert.strictEqual(EntitlementService.canExecuteScanMode('free', 'aggressive'), false);
    assert.strictEqual(EntitlementService.canExecuteScanMode('free', 'private'), false);
    assert.strictEqual(EntitlementService.canDownloadPdf('free'), false);
    assert.strictEqual(EntitlementService.canUseCompanionExtension('free'), false);
  });

  // TEST 2: Premium Account Entitlements
  await test('EntitlementService permits all advanced modes and exports for Premium accounts', async () => {
    assert.strictEqual(EntitlementService.canExecuteScanMode('premium', 'normal'), true);
    assert.strictEqual(EntitlementService.canExecuteScanMode('premium', 'aggressive'), true);
    assert.strictEqual(EntitlementService.canExecuteScanMode('premium', 'private'), true);
    assert.strictEqual(EntitlementService.canDownloadPdf('premium'), true);
    assert.strictEqual(EntitlementService.canUseCompanionExtension('premium'), true);
  });

  // TEST 3: Demonstration Upgrade & Plan State Transition
  await test('Simulated upgrade flow transitions account to Premium and persists to disk', async () => {
    const signup = await authRepo.register({
      firstName: 'Samantha',
      lastName: 'Carter',
      email: 'carter@securescope.local',
      password: 'SecurePassword123!',
    });
    assert.strictEqual(signup.user.plan, 'free');

    // Upgrade to Premium
    const upgraded = await authRepo.updatePlan(signup.user.id, 'premium');
    assert.strictEqual(upgraded.plan, 'premium');
    assert.strictEqual(upgraded.subscription.status, 'active');
    assert.strictEqual(upgraded.subscription.priceInr, 299);

    // Verify on-disk persistence
    const reloaded = await authRepo.getUserById(signup.user.id);
    assert.strictEqual(reloaded.plan, 'premium');
    assert.strictEqual(reloaded.subscription.status, 'active');

    // Revert back to Free
    const downgraded = await authRepo.updatePlan(signup.user.id, 'free');
    assert.strictEqual(downgraded.plan, 'free');
    assert.strictEqual(downgraded.subscription.status, 'inactive');
  });

  // TEST 4: Executive PDF HTML Template Generation
  await test('PdfGeneratorService constructs well-formatted executive HTML report', async () => {
    const mockReport = {
      id: 'rep_pdf_test_123',
      scanId: 'scn_pdf_test_123',
      userId: 'usr_carter',
      scan: {
        id: 'scn_pdf_test_123',
        userId: 'usr_carter',
        targetUrl: 'https://executive-target.local',
        normalizedTarget: 'executive-target.local',
        scanMode: 'aggressive',
        status: 'completed',
        postureScore: 82,
        highestSeverity: 'HIGH',
        startedAt: new Date().toISOString(),
        durationMs: 1450,
        scannerVersion: '1.0.0',
        isDemo: false,
      },
      findings: [
        {
          id: 'fnd_1',
          scanId: 'scn_pdf_test_123',
          title: 'Missing Content Security Policy (CSP)',
          category: 'Injection Defense',
          severity: 'HIGH',
          confidence: 'CONFIRMED',
          affectedResource: 'https://executive-target.local',
          description: 'No Content-Security-Policy header was observed.',
          impact: 'Increases susceptibility to Cross-Site Scripting (XSS).',
          evidence: 'Header absent.',
          remediation: 'Deploy a strict CSP header.',
          references: ['W3C CSP Level 3'],
          detectedAt: new Date().toISOString(),
        },
      ],
      executiveSummary: 'Assessment observed acceptable baseline security posture.',
      findingCounts: {
        critical: 0,
        high: 1,
        medium: 0,
        low: 0,
        informational: 0,
        passed: 6,
      },
      checks: { completed: 7, skipped: 0, failed: 0 },
      limitations: ['Passive analysis only.'],
      createdAt: new Date().toISOString(),
    };

    const html = PdfGeneratorService.generateHtmlTemplate(mockReport);
    assert(html.includes('SECURESCOPE'), 'HTML must include brand header');
    assert(html.includes('executive-target.local'), 'HTML must include target URL');
    assert(html.includes('Posture Score: 82 / 100'), 'HTML must include posture score');
    assert(html.includes('Missing Content Security Policy (CSP)'), 'HTML must include finding title');
    assert(html.includes('HIGH'), 'HTML must include severity');
  });

  // TEST 5: History Persistence, User Isolation & Deletion
  await test('SQLiteScanRepository isolates scan history by user and handles deletion', async () => {
    const userA = 'usr_alice_123';
    const userB = 'usr_bob_456';

    const reportA = {
      id: 'rep_a_1',
      scanId: 'scn_a_1',
      userId: userA,
      scan: {
        id: 'scn_a_1',
        userId: userA,
        targetUrl: 'https://alice-domain.com',
        normalizedTarget: 'alice-domain.com',
        scanMode: 'normal',
        status: 'completed',
        postureScore: 92,
        highestSeverity: 'LOW',
        startedAt: new Date().toISOString(),
        durationMs: 800,
        scannerVersion: '1.0.0',
        isDemo: false,
      },
      findings: [],
      executiveSummary: 'Strong security posture.',
      findingCounts: { critical: 0, high: 0, medium: 0, low: 0, informational: 0, passed: 8 },
      checks: { completed: 8, skipped: 0, failed: 0 },
      limitations: [],
      createdAt: new Date().toISOString(),
    };

    const reportB = {
      id: 'rep_b_1',
      scanId: 'scn_b_1',
      userId: userB,
      scan: {
        id: 'scn_b_1',
        userId: userB,
        targetUrl: 'https://bob-domain.com',
        normalizedTarget: 'bob-domain.com',
        scanMode: 'aggressive',
        status: 'completed',
        postureScore: 70,
        highestSeverity: 'HIGH',
        startedAt: new Date().toISOString(),
        durationMs: 1200,
        scannerVersion: '1.0.0',
        isDemo: false,
      },
      findings: [],
      executiveSummary: 'Moderate risk.',
      findingCounts: { critical: 0, high: 1, medium: 0, low: 0, informational: 0, passed: 7 },
      checks: { completed: 8, skipped: 0, failed: 0 },
      limitations: [],
      createdAt: new Date().toISOString(),
    };

    await scanRepo.saveReport(reportA);
    await scanRepo.saveReport(reportB);

    // Verify isolation
    const historyA = await scanRepo.getScansByUser(userA);
    assert.strictEqual(historyA.length, 1, 'User A must have 1 scan');
    assert.strictEqual(historyA[0].normalizedTarget, 'alice-domain.com');

    const historyB = await scanRepo.getScansByUser(userB);
    assert.strictEqual(historyB.length, 1, 'User B must have 1 scan');
    assert.strictEqual(historyB[0].normalizedTarget, 'bob-domain.com');

    // Verify Deletion
    const deleteResult = await scanRepo.deleteScan('scn_a_1', userA);
    assert.strictEqual(deleteResult, true, 'Deletion must return true');

    const updatedHistoryA = await scanRepo.getScansByUser(userA);
    assert.strictEqual(updatedHistoryA.length, 0, 'User A history must be empty after deletion');

    const retrievedReport = await scanRepo.getReportByScanId('scn_a_1');
    assert.strictEqual(retrievedReport, null, 'Deleted report must return null');

    // User B scan must remain untouched
    const untouchedHistoryB = await scanRepo.getScansByUser(userB);
    assert.strictEqual(untouchedHistoryB.length, 1, 'User B scan must still exist');
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

runPremiumHistoryTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

