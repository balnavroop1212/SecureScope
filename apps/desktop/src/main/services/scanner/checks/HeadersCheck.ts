import { Finding } from '@shared/types';

export interface HeadersCheckResult {
  findings: Finding[];
  checksCompleted: number;
  checksPassed: number;
}

export class HeadersCheck {
  public static execute(
    headers: Record<string, string | string[] | undefined>,
    targetUrl: string,
    scanId: string
  ): HeadersCheckResult {
    const findings: Finding[] = [];
    let checksCompleted = 0;
    let checksPassed = 0;
    const now = new Date().toISOString();

    const getHeader = (name: string): string | undefined => {
      const lower = name.toLowerCase();
      for (const [key, val] of Object.entries(headers)) {
        if (key.toLowerCase() === lower) {
          return Array.isArray(val) ? val.join(', ') : val;
        }
      }
      return undefined;
    };

    // 1. HTTP Strict Transport Security (HSTS)
    checksCompleted++;
    const hsts = getHeader('Strict-Transport-Security');
    if (!hsts) {
      findings.push({
        id: `fnd_hdr_hsts_missing_${Date.now()}`,
        scanId,
        title: 'Missing HTTP Strict Transport Security (HSTS)',
        category: 'Configuration',
        severity: 'HIGH',
        confidence: 'CONFIRMED',
        affectedResource: targetUrl,
        description: 'The HTTP Strict-Transport-Security header is not returned by the server.',
        impact: 'Users connecting via HTTP or bookmarks are vulnerable to SSL-stripping and man-in-the-middle attacks.',
        evidence: 'Response headers did not include Strict-Transport-Security.',
        remediation: 'Configure the web server to send: Strict-Transport-Security: max-age=31536000; includeSubDomains; preload',
        references: ['RFC 6797', 'OWASP Cheat Sheet: HSTS', 'CWE-319: Cleartext Transmission'],
        detectedAt: now,
      });
    } else {
      const maxAgeMatch = hsts.match(/max-age=(\d+)/i);
      const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 0;
      if (maxAge < 15552000) {
        // Less than 180 days
        findings.push({
          id: `fnd_hdr_hsts_low_age_${Date.now()}`,
          scanId,
          title: 'Insufficient HSTS max-age Duration',
          category: 'Configuration',
          severity: 'LOW',
          confidence: 'CONFIRMED',
          affectedResource: targetUrl,
          description: `The HSTS max-age duration is set to ${maxAge} seconds (less than the recommended minimum of 180 days / 15,552,000s).`,
          impact: 'Short HSTS lifetimes reduce the window of protection against downgrade attacks.',
          evidence: `Strict-Transport-Security: ${hsts}`,
          remediation: 'Increase max-age to at least 31536000 seconds (1 year).',
          references: ['RFC 6797'],
          detectedAt: now,
        });
      } else {
        checksPassed++;
      }
    }

    // 2. Content Security Policy (CSP)
    checksCompleted++;
    const csp = getHeader('Content-Security-Policy');
    if (!csp) {
      findings.push({
        id: `fnd_hdr_csp_missing_${Date.now()}`,
        scanId,
        title: 'Missing Content Security Policy (CSP)',
        category: 'Injection Defense',
        severity: 'HIGH',
        confidence: 'CONFIRMED',
        affectedResource: targetUrl,
        description: 'No Content-Security-Policy header was observed in the HTTP response.',
        impact: 'Leaves the application without Defense-in-Depth against Cross-Site Scripting (XSS), data injection, and malicious frame inclusion.',
        evidence: 'Content-Security-Policy header was absent in response headers.',
        remediation: 'Define a restrictive Content-Security-Policy restricting script sources, frame ancestors, and object sources.',
        references: ['W3C CSP Level 3', 'OWASP Top 10 A03:2021-Injection', 'CWE-79'],
        detectedAt: now,
      });
    } else {
      if (csp.includes("'unsafe-inline'") || csp.includes("'unsafe-eval'")) {
        findings.push({
          id: `fnd_hdr_csp_unsafe_${Date.now()}`,
          scanId,
          title: 'Content Security Policy Contains Insecure Directives',
          category: 'Injection Defense',
          severity: 'MEDIUM',
          confidence: 'HIGH',
          affectedResource: targetUrl,
          description: "The CSP configuration includes 'unsafe-inline' or 'unsafe-eval', which weakens script execution boundaries.",
          impact: 'Attackers who inject inline HTML or string-evaluated payloads can execute JavaScript in user contexts.',
          evidence: `Content-Security-Policy: ${csp.substring(0, 200)}...`,
          remediation: 'Refactor inline scripts to external bundles and adopt cryptographic nonces or hashes (e.g. script-src \'nonce-...\').',
          references: ['W3C CSP Level 3', 'CWE-79'],
          detectedAt: now,
        });
      } else {
        checksPassed++;
      }
    }

    // 3. X-Frame-Options (Clickjacking defense)
    checksCompleted++;
    const xfo = getHeader('X-Frame-Options');
    const hasFrameAncestors = csp && csp.includes('frame-ancestors');
    if (!xfo && !hasFrameAncestors) {
      findings.push({
        id: `fnd_hdr_xfo_missing_${Date.now()}`,
        scanId,
        title: 'Missing Anti-Clickjacking Protection (X-Frame-Options)',
        category: 'UI Redressing',
        severity: 'MEDIUM',
        confidence: 'CONFIRMED',
        affectedResource: targetUrl,
        description: 'Neither X-Frame-Options nor CSP frame-ancestors is configured on this resource.',
        impact: 'Third-party sites can embed this application inside an iframe to conduct clickjacking or deceptive UI redress attacks.',
        evidence: 'Neither X-Frame-Options nor CSP frame-ancestors directives were present.',
        remediation: 'Send X-Frame-Options: DENY or SAMEORIGIN, or configure frame-ancestors \'self\' in Content-Security-Policy.',
        references: ['RFC 7034', 'OWASP Clickjacking Defense Cheat Sheet', 'CWE-1021'],
        detectedAt: now,
      });
    } else {
      checksPassed++;
    }

    // 4. X-Content-Type-Options (MIME Sniffing Defense)
    checksCompleted++;
    const xcto = getHeader('X-Content-Type-Options');
    if (!xcto || !xcto.toLowerCase().includes('nosniff')) {
      findings.push({
        id: `fnd_hdr_xcto_missing_${Date.now()}`,
        scanId,
        title: 'Missing MIME-Sniffing Defense (X-Content-Type-Options)',
        category: 'Configuration',
        severity: 'LOW',
        confidence: 'CONFIRMED',
        affectedResource: targetUrl,
        description: 'The X-Content-Type-Options: nosniff header is missing.',
        impact: 'Older and non-standard browsers may attempt to guess the content type of responses, potentially executing user uploads as scripts.',
        evidence: `X-Content-Type-Options was: ${xcto || '[ABSENT]'}`,
        remediation: 'Configure your web server to return: X-Content-Type-Options: nosniff',
        references: ['Fetch Standard', 'CWE-430: Deployment of Wrong Handler'],
        detectedAt: now,
      });
    } else {
      checksPassed++;
    }

    // 5. Referrer-Policy
    checksCompleted++;
    const refPol = getHeader('Referrer-Policy');
    if (!refPol) {
      findings.push({
        id: `fnd_hdr_ref_missing_${Date.now()}`,
        scanId,
        title: 'Missing Referrer-Policy Header',
        category: 'Information Disclosure',
        severity: 'LOW',
        confidence: 'CONFIRMED',
        affectedResource: targetUrl,
        description: 'No explicit Referrer-Policy header was observed.',
        impact: 'Sensitive path or query parameters in URLs may be leaked in the Referer header to external third-party origins.',
        evidence: 'Referrer-Policy header was absent.',
        remediation: 'Set Referrer-Policy: strict-origin-when-cross-origin or no-referrer.',
        references: ['W3C Referrer Policy', 'CWE-200: Exposure of Sensitive Information'],
        detectedAt: now,
      });
    } else {
      checksPassed++;
    }

    return { findings, checksCompleted, checksPassed };
  }
}

