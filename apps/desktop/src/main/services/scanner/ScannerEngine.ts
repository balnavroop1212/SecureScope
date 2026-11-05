import * as crypto from 'crypto';
import {
  ScanMode,
  ScanRecord,
  Finding,
  ScanReport,
  ScanProgressEvent,
  SeverityLevel,
} from '@shared/types';
import { ScopeValidator, ValidatedScope } from './ScopeValidator';
import { TlsCheck } from './checks/TlsCheck';
import { HeadersCheck } from './checks/HeadersCheck';
import { CookiesCheck } from './checks/CookiesCheck';
import { InfoDisclosureCheck } from './checks/InfoDisclosureCheck';
import { AggressiveChecks } from './checks/AggressiveChecks';
import { DemoTargetCheck } from './checks/DemoTargetCheck';
import { IScanRepository } from '../storage/SQLiteScanRepository';

export interface StartScanOptions {
  userId: string;
  url: string;
  scanMode: ScanMode;
  authorizedScopeConfirmed: boolean;
  isDemoMode?: boolean;
  onProgress?: (progress: ScanProgressEvent) => void;
}

export class ScannerEngine {
  private activeControllers = new Map<string, AbortController>();
  private readonly scanRepo: IScanRepository;

  constructor(scanRepo: IScanRepository) {
    this.scanRepo = scanRepo;
  }

  public cancelScan(scanId: string): boolean {
    const controller = this.activeControllers.get(scanId);
    if (controller) {
      controller.abort();
      this.activeControllers.delete(scanId);
      return true;
    }
    return false;
  }

  public async startScan(options: StartScanOptions): Promise<ScanReport> {
    const { userId, url, scanMode, authorizedScopeConfirmed, isDemoMode, onProgress } = options;

    if (!authorizedScopeConfirmed) {
      throw new Error('Mandatory authorization declaration required: you must confirm authorized scope.');
    }

    const scanId = `scn_${crypto.randomBytes(8).toString('hex')}`;
    const reportId = `rep_${crypto.randomBytes(8).toString('hex')}`;
    const abortController = new AbortController();
    this.activeControllers.set(scanId, abortController);

    const startedAt = new Date().toISOString();
    const startTime = Date.now();

    const emit = (stage: string, percent: number, currentCheck: string, completed: number, total: number) => {
      onProgress?.({
        scanId,
        stage,
        progressPercent: percent,
        checksCompleted: completed,
        totalChecks: total,
        currentCheckName: currentCheck,
      });
    };

    try {
      // ---------------------------------------------------------
      // STAGE 1: Validating Target
      // ---------------------------------------------------------
      emit('Validating Target', 15, 'URL Syntax & Scheme Inspection', 1, 10);
      if (abortController.signal.aborted) throw new Error('Scan cancelled by user.');

      // ---------------------------------------------------------
      // STAGE 2: Validating Authorized Scope & SSRF Checks
      // ---------------------------------------------------------
      emit('Validating Authorized Scope', 30, 'Pre-flight DNS & SSRF Boundary Check', 2, 10);
      const scope: ValidatedScope = await ScopeValidator.validateScope(url, !!isDemoMode);
      if (abortController.signal.aborted) throw new Error('Scan cancelled by user.');

      let findings: Finding[] = [];
      let totalChecksCompleted = 2;
      let totalChecksPassed = 0;

      // Handle Sandbox Demo Target
      if (scope.isDemo) {
        emit('Collecting Public Security Information', 50, 'Executing Sandbox Mock Telemetry', 5, 10);
        await new Promise((r) => setTimeout(r, 600)); // Controlled demo animation delay
        if (abortController.signal.aborted) throw new Error('Scan cancelled by user.');

        emit('Assessing Security Configuration', 75, 'Simulating Configuration Checks', 8, 10);
        await new Promise((r) => setTimeout(r, 600));
        if (abortController.signal.aborted) throw new Error('Scan cancelled by user.');

        findings = DemoTargetCheck.generateDemoFindings(scanId, scope.normalizedUrl);
        totalChecksCompleted = 8;
        totalChecksPassed = 3;
      } else {
        // ---------------------------------------------------------
        // STAGE 3: Collecting Public Security Information (TLS Probes)
        // ---------------------------------------------------------
        emit('Collecting Public Security Information', 50, 'TLS Peer Certificate Handshake', 4, 10);
        if (scope.protocol === 'https:') {
          const tlsResult = await TlsCheck.execute(scope.hostname, scope.port, scanId, 8000);
          findings.push(...tlsResult.findings);
          totalChecksCompleted += tlsResult.checksCompleted;
          totalChecksPassed += tlsResult.checksPassed;
        }
        if (abortController.signal.aborted) throw new Error('Scan cancelled by user.');

        // ---------------------------------------------------------
        // STAGE 4: Assessing Security Configuration & Headers
        // ---------------------------------------------------------
        emit('Assessing Security Configuration', 75, 'Analyzing HTTP Response Headers & Cookies', 7, 10);
        
        let responseHeaders: Record<string, string | string[] | undefined> = {};
        try {
          const fetchRes = await fetch(scope.normalizedUrl, {
            method: 'GET',
            signal: abortController.signal,
            headers: {
              'User-Agent': 'SecureScope-Assessment-Engine/1.0 (Passive Educational Assessment)',
            },
          });

          // Extract response headers
          fetchRes.headers.forEach((val, key) => {
            responseHeaders[key.toLowerCase()] = val;
          });

          // Headers checks
          const headersResult = HeadersCheck.execute(responseHeaders, scope.normalizedUrl, scanId);
          findings.push(...headersResult.findings);
          totalChecksCompleted += headersResult.checksCompleted;
          totalChecksPassed += headersResult.checksPassed;

          // Cookies checks
          const setCookie = fetchRes.headers.get('set-cookie');
          const cookiesResult = CookiesCheck.execute(
            setCookie || undefined,
            scope.normalizedUrl,
            scanId,
            scope.protocol === 'https:'
          );
          findings.push(...cookiesResult.findings);
          totalChecksCompleted += cookiesResult.checksCompleted;
          totalChecksPassed += cookiesResult.checksPassed;

          // Info disclosure checks
          const infoResult = InfoDisclosureCheck.execute(responseHeaders, scope.normalizedUrl, scanId);
          findings.push(...infoResult.findings);
          totalChecksCompleted += infoResult.checksCompleted;
          totalChecksPassed += infoResult.checksPassed;

          // Aggressive Extended Checks (if selected)
          if (scanMode === 'aggressive') {
            const aggrResult = await AggressiveChecks.execute(scope.normalizedUrl, scanId, 8000);
            findings.push(...aggrResult.findings);
            totalChecksCompleted += aggrResult.checksCompleted;
            totalChecksPassed += aggrResult.checksPassed;
          }
        } catch (fetchErr: any) {
          if (abortController.signal.aborted) throw new Error('Scan cancelled by user.');
          // If HTTP connection failed, record finding
          findings.push({
            id: `fnd_net_unreachable_${Date.now()}`,
            scanId,
            title: 'HTTP Endpoint Unreachable or Timed Out',
            category: 'Availability',
            severity: 'MEDIUM',
            confidence: 'CONFIRMED',
            affectedResource: scope.normalizedUrl,
            description: `The assessment engine could not establish an HTTP connection: ${fetchErr.message}`,
            impact: 'Automated configuration checks could not inspect HTTP response headers.',
            evidence: `Error details: ${fetchErr.message}`,
            remediation: 'Ensure the target web server is active and accessible to standard HTTP clients.',
            references: [],
            detectedAt: new Date().toISOString(),
          });
        }
      }

      if (abortController.signal.aborted) throw new Error('Scan cancelled by user.');

      // ---------------------------------------------------------
      // STAGE 5: Analyzing Findings & Scoring
      // ---------------------------------------------------------
      emit('Analyzing Findings', 90, 'Computing Defensive Posture & Classifying Severity', 9, 10);

      // Sensitive Data Redaction for Private Mode
      if (scanMode === 'private') {
        findings = findings.map((f) => ({
          ...f,
          evidence: f.evidence ? f.evidence.replace(/[a-zA-Z0-9_\-\.]{20,}/g, '[REDACTED_TOKEN]') : '',
          affectedResource: f.affectedResource.replace(/\?.*$/, '?query=[REDACTED]'),
        }));
      }

      // Finding counts
      const counts = {
        critical: findings.filter((f) => f.severity === 'CRITICAL').length,
        high: findings.filter((f) => f.severity === 'HIGH').length,
        medium: findings.filter((f) => f.severity === 'MEDIUM').length,
        low: findings.filter((f) => f.severity === 'LOW').length,
        informational: findings.filter((f) => f.severity === 'INFORMATIONAL').length,
        passed: totalChecksPassed,
      };

      // Highest Severity
      let highestSeverity: SeverityLevel | 'NONE' = 'NONE';
      if (counts.critical > 0) highestSeverity = 'CRITICAL';
      else if (counts.high > 0) highestSeverity = 'HIGH';
      else if (counts.medium > 0) highestSeverity = 'MEDIUM';
      else if (counts.low > 0) highestSeverity = 'LOW';
      else if (counts.informational > 0) highestSeverity = 'INFORMATIONAL';

      // Explainable Posture Score Calculation
      // Score = max(0, 100 - (critical * 30 + high * 18 + medium * 8 + low * 3))
      const penalty = counts.critical * 30 + counts.high * 18 + counts.medium * 8 + counts.low * 3;
      const postureScore = Math.max(0, 100 - penalty);

      const completedAt = new Date().toISOString();
      const durationMs = Date.now() - startTime;

      const scanRecord: ScanRecord = {
        id: scanId,
        userId,
        targetUrl: scope.normalizedUrl,
        normalizedTarget: scope.normalizedTarget,
        scanMode,
        status: 'completed',
        postureScore,
        highestSeverity,
        startedAt,
        completedAt,
        durationMs,
        scannerVersion: '1.0.0',
        targetIp: scope.ip,
        isDemo: scope.isDemo,
      };

      // Executive Summary formulation
      let executiveSummary = '';
      if (scope.isDemo) {
        executiveSummary = `[DEMO DATA]: Simulated security assessment conducted against local test target (${scope.normalizedTarget}). Found ${findings.length} instructional vulnerability findings across cryptographic, header, and cookie domains.`;
      } else if (counts.critical > 0 || counts.high > 0) {
        executiveSummary = `Assessment of ${scope.normalizedTarget} identified ${counts.critical} critical and ${counts.high} high-severity defensive configuration weaknesses requiring prompt remediation to protect against data interception or downgrade attacks.`;
      } else if (counts.medium > 0) {
        executiveSummary = `Assessment of ${scope.normalizedTarget} observed acceptable baseline security posture with ${counts.medium} medium-severity configuration hardening opportunities.`;
      } else {
        executiveSummary = `Assessment of ${scope.normalizedTarget} demonstrated strong adherence to evaluated passive security headers and modern SSL/TLS configurations.`;
      }

      // Assessment Limitations
      const limitations = [
        'Passive Assessment Only: Evaluation is restricted strictly to non-destructive configuration inspection and does not conduct active penetration testing.',
        'Absence of findings does not guarantee immunity from application-layer vulnerabilities such as SQL injection, authentication bypass, or business logic flaws.',
        'Results reflect target server behavior at the exact timestamp of assessment and may vary across CDNs, geo-distributed clusters, or cloud load balancers.',
      ];

      const report: ScanReport = {
        id: reportId,
        scanId,
        userId,
        scan: scanRecord,
        findings,
        executiveSummary,
        findingCounts: counts,
        checks: {
          completed: totalChecksCompleted,
          skipped: scanMode === 'normal' ? 3 : 0,
          failed: 0,
        },
        limitations,
        createdAt: completedAt,
      };

      // ---------------------------------------------------------
      // STAGE 6: Generating & Persisting Report
      // ---------------------------------------------------------
      emit('Generating Report', 95, 'Writing Report to Persistent SQLite Store', 10, 10);
      await this.scanRepo.saveReport(report);

      emit('Completed', 100, 'Assessment Completed Successfully', 10, 10);
      return report;
    } finally {
      this.activeControllers.delete(scanId);
    }
  }
}

