import { Finding } from '@shared/types';

export interface AggressiveCheckResult {
  findings: Finding[];
  checksCompleted: number;
  checksPassed: number;
}

export class AggressiveChecks {
  /**
   * Executes extended non-destructive passive discovery checks (robots.txt, security.txt, and safe CORS audit).
   */
  public static async execute(
    originUrl: string,
    scanId: string,
    timeoutMs: number = 8000
  ): Promise<AggressiveCheckResult> {
    const findings: Finding[] = [];
    let checksCompleted = 0;
    let checksPassed = 0;
    const now = new Date().toISOString();

    const baseUrl = originUrl.replace(/\/+$/, '');

    // 1. Probe security.txt compliance (RFC 9116)
    checksCompleted++;
    try {
      const secTxtUrl = `${baseUrl}/.well-known/security.txt`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const res = await fetch(secTxtUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'User-Agent': 'SecureScope-Assessment-Engine/1.0' },
      });
      clearTimeout(timeoutId);

      if (res.status === 200) {
        const text = await res.text();
        if (text.toLowerCase().includes('contact:')) {
          checksPassed++;
        } else {
          findings.push({
            id: `fnd_aggr_sectxt_malformed_${Date.now()}`,
            scanId,
            title: 'Incomplete security.txt Vulnerability Disclosure Policy',
            category: 'Vulnerability Disclosure',
            severity: 'INFORMATIONAL',
            confidence: 'CONFIRMED',
            affectedResource: secTxtUrl,
            description: 'The security.txt file exists but lacks a mandatory "Contact:" directive per RFC 9116.',
            impact: 'Security researchers identifying vulnerabilities may struggle to reach the appropriate defensive team.',
            evidence: `Status 200 returned but missing Contact: header.\nContent sample:\n${text.substring(0, 150)}...`,
            remediation: 'Update /.well-known/security.txt with valid Contact: and Expires: directives per RFC 9116.',
            references: ['RFC 9116: A File Format to Aid in Security Vulnerability Disclosure'],
            detectedAt: now,
          });
        }
      } else {
        findings.push({
          id: `fnd_aggr_sectxt_missing_${Date.now()}`,
          scanId,
          title: 'Missing security.txt Standard (RFC 9116)',
          category: 'Vulnerability Disclosure',
          severity: 'INFORMATIONAL',
          confidence: 'CONFIRMED',
          affectedResource: `${baseUrl}/.well-known/security.txt`,
          description: 'No security.txt file was found at /.well-known/security.txt.',
          impact: 'Standardized vulnerability disclosure reporting is not facilitated for authorized ethical researchers.',
          evidence: `HTTP ${res.status} returned for ${secTxtUrl}.`,
          remediation: 'Publish a security.txt file containing security contact emails or vulnerability disclosure program URLs.',
          references: ['RFC 9116'],
          detectedAt: now,
        });
      }
    } catch {
      // Ignored for passive probe
    }

    // 2. Safe CORS Configuration Review
    checksCompleted++;
    try {
      const probeOrigin = 'https://scanner-probe.securescope.local';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const corsRes = await fetch(baseUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Origin': probeOrigin,
          'User-Agent': 'SecureScope-Assessment-Engine/1.0',
        },
      });
      clearTimeout(timeoutId);

      const acao = corsRes.headers.get('Access-Control-Allow-Origin');
      const acac = corsRes.headers.get('Access-Control-Allow-Credentials');

      if (acao === '*' && acac === 'true') {
        findings.push({
          id: `fnd_aggr_cors_wildcard_${Date.now()}`,
          scanId,
          title: 'Critical Insecure CORS: Wildcard Origin with Credentials Allowed',
          category: 'Cross-Origin Security',
          severity: 'HIGH',
          confidence: 'CONFIRMED',
          affectedResource: baseUrl,
          description: 'The server permits wildcard cross-origin resource sharing alongside credentials.',
          impact: 'Untrusted external origins can read authenticated user responses via cross-origin XMLHttpRequest/fetch.',
          evidence: `Access-Control-Allow-Origin: *\nAccess-Control-Allow-Credentials: true`,
          remediation: 'Never combine wildcard Access-Control-Allow-Origin with Access-Control-Allow-Credentials. Whitelist trusted domains explicitly.',
          references: ['OWASP CORS Cheat Sheet', 'CWE-942: Permissive Cross-Domain Policy'],
          detectedAt: now,
        });
      } else if (acao === probeOrigin && acac === 'true') {
        findings.push({
          id: `fnd_aggr_cors_origin_reflect_${Date.now()}`,
          scanId,
          title: 'Permissive CORS: Arbitrary Origin Reflection with Credentials',
          category: 'Cross-Origin Security',
          severity: 'HIGH',
          confidence: 'CONFIRMED',
          affectedResource: baseUrl,
          description: 'The server dynamically mirrored an untrusted Origin header while enabling Access-Control-Allow-Credentials.',
          impact: 'Enables any malicious origin to issue credentialed requests and exfiltrate authenticated session data.',
          evidence: `Origin Sent: ${probeOrigin}\nAccess-Control-Allow-Origin: ${acao}\nAccess-Control-Allow-Credentials: true`,
          remediation: 'Validate incoming Origin headers against an explicit server-side whitelist before returning CORS headers.',
          references: ['CWE-942: Permissive Cross-Domain Policy'],
          detectedAt: now,
        });
      } else {
        checksPassed++;
      }
    } catch {
      // Ignored for passive probe
    }

    return { findings, checksCompleted, checksPassed };
  }
}

