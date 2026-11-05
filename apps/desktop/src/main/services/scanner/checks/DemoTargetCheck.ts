import { Finding } from '@shared/types';

export class DemoTargetCheck {
  /**
   * Generates realistic demonstration findings for offline sandbox targets (localhost/loopback).
   * All findings are unambiguously tagged with isDemo: true and "[DEMO DATA]" prefix.
   */
  public static generateDemoFindings(scanId: string, targetUrl: string): Finding[] {
    const now = new Date().toISOString();
    return [
      {
        id: `fnd_demo_hsts_${scanId}`,
        scanId,
        title: '[DEMO DATA] Missing HTTP Strict Transport Security (HSTS)',
        category: 'Configuration',
        severity: 'HIGH',
        confidence: 'CONFIRMED',
        affectedResource: targetUrl,
        description: 'DEMONSTRATION SAMPLE: The test web server does not enforce Strict-Transport-Security.',
        impact: 'Users on insecure networks may be downgraded from HTTPS to plain HTTP.',
        evidence: 'Response headers did not return Strict-Transport-Security.',
        remediation: 'Configure: Strict-Transport-Security: max-age=31536000; includeSubDomains',
        references: ['RFC 6797', 'CWE-319'],
        detectedAt: now,
      },
      {
        id: `fnd_demo_csp_${scanId}`,
        scanId,
        title: '[DEMO DATA] Weak Content Security Policy Directives',
        category: 'Injection Defense',
        severity: 'MEDIUM',
        confidence: 'HIGH',
        affectedResource: targetUrl,
        description: "DEMONSTRATION SAMPLE: Content-Security-Policy contains 'unsafe-inline' without nonce restrictions.",
        impact: 'Facilitates client-side Cross-Site Scripting (XSS) execution if an HTML injection vector is discovered.',
        evidence: "Content-Security-Policy: default-src 'self' 'unsafe-inline';",
        remediation: 'Remove unsafe-inline and transition to cryptographic nonces or script hashes.',
        references: ['W3C CSP Level 3', 'CWE-79'],
        detectedAt: now,
      },
      {
        id: `fnd_demo_cookie_${scanId}`,
        scanId,
        title: '[DEMO DATA] Session Cookie Missing "Secure" Attribute',
        category: 'Session Management',
        severity: 'MEDIUM',
        confidence: 'CONFIRMED',
        affectedResource: `${targetUrl} (Cookie: session_id)`,
        description: 'DEMONSTRATION SAMPLE: The application session cookie is transmitted without the Secure flag.',
        impact: 'Session identifiers can be intercepted in transit over unencrypted network channels.',
        evidence: 'Set-Cookie: session_id=[REDACTED]; Path=/; HttpOnly',
        remediation: 'Add "; Secure" to the Set-Cookie definition on all authentication endpoints.',
        references: ['RFC 6265', 'CWE-614'],
        detectedAt: now,
      },
      {
        id: `fnd_demo_server_${scanId}`,
        scanId,
        title: '[DEMO DATA] Web Server Banner Disclosing Detailed Version',
        category: 'Information Disclosure',
        severity: 'LOW',
        confidence: 'CONFIRMED',
        affectedResource: targetUrl,
        description: 'DEMONSTRATION SAMPLE: The Server header reveals exact web server version: "Apache/2.4.52 (Ubuntu)".',
        impact: 'Facilitates attacker reconnaissance for known public vulnerabilities in specific server versions.',
        evidence: 'Server: Apache/2.4.52 (Ubuntu)',
        remediation: 'Set ServerTokens Prod and ServerSignature Off in web server configuration.',
        references: ['CWE-200', 'OWASP WSTG-INFO-02'],
        detectedAt: now,
      },
      {
        id: `fnd_demo_sectxt_${scanId}`,
        scanId,
        title: '[DEMO DATA] Missing Vulnerability Disclosure Policy (security.txt)',
        category: 'Vulnerability Disclosure',
        severity: 'INFORMATIONAL',
        confidence: 'CONFIRMED',
        affectedResource: `${targetUrl}/.well-known/security.txt`,
        description: 'DEMONSTRATION SAMPLE: No security.txt file exists to guide ethical researchers in reporting vulnerabilities.',
        impact: 'May delay notification of critical security findings to the development team.',
        evidence: 'HTTP 404 Not Found returned for /.well-known/security.txt.',
        remediation: 'Create and deploy /.well-known/security.txt adhering to RFC 9116.',
        references: ['RFC 9116'],
        detectedAt: now,
      },
    ];
  }
}

