import { Finding } from '@shared/types';

export interface CookiesCheckResult {
  findings: Finding[];
  checksCompleted: number;
  checksPassed: number;
}

export class CookiesCheck {
  public static execute(
    setCookieHeaders: string | string[] | undefined,
    targetUrl: string,
    scanId: string,
    isHttps: boolean
  ): CookiesCheckResult {
    const findings: Finding[] = [];
    let checksCompleted = 0;
    let checksPassed = 0;
    const now = new Date().toISOString();

    if (!setCookieHeaders) {
      return { findings, checksCompleted: 1, checksPassed: 1 };
    }

    const cookies = Array.isArray(setCookieHeaders)
      ? setCookieHeaders
      : [setCookieHeaders];

    for (const rawCookie of cookies) {
      checksCompleted++;
      const parts = rawCookie.split(';').map((p) => p.trim());
      const nameVal = parts[0];
      const cookieName = nameVal.split('=')[0];

      const lowerParts = parts.map((p) => p.toLowerCase());
      const hasSecure = lowerParts.includes('secure');
      const hasHttpOnly = lowerParts.includes('httponly');
      const sameSitePart = lowerParts.find((p) => p.startsWith('samesite='));

      let hasIssue = false;

      // 1. Missing Secure flag on HTTPS
      if (isHttps && !hasSecure) {
        hasIssue = true;
        findings.push({
          id: `fnd_cookie_insecure_${Date.now()}_${cookieName}`,
          scanId,
          title: `Cookie "${cookieName}" Missing "Secure" Attribute`,
          category: 'Session Management',
          severity: 'MEDIUM',
          confidence: 'CONFIRMED',
          affectedResource: `${targetUrl} (Cookie: ${cookieName})`,
          description: `The cookie "${cookieName}" was set without the "Secure" flag over an HTTPS connection.`,
          impact: 'The browser will transmit this cookie over unencrypted HTTP connections if requested, risking credential eavesdropping.',
          evidence: `Set-Cookie: ${cookieName}=[REDACTED]; ${parts.slice(1).join('; ')}`,
          remediation: `Append "; Secure" to the Set-Cookie definition for "${cookieName}".`,
          references: ['RFC 6265bis', 'CWE-614: Sensitive Cookie in HTTPS Without Secure Flag'],
          detectedAt: now,
        });
      }

      // 2. Missing HttpOnly flag
      if (!hasHttpOnly) {
        hasIssue = true;
        findings.push({
          id: `fnd_cookie_nohttponly_${Date.now()}_${cookieName}`,
          scanId,
          title: `Cookie "${cookieName}" Missing "HttpOnly" Attribute`,
          category: 'Session Management',
          severity: 'MEDIUM',
          confidence: 'CONFIRMED',
          affectedResource: `${targetUrl} (Cookie: ${cookieName})`,
          description: `The cookie "${cookieName}" does not specify "HttpOnly", making it accessible to client-side scripts.`,
          impact: 'If a Cross-Site Scripting (XSS) vulnerability exists on any page within this scope, attackers can steal this cookie via document.cookie.',
          evidence: `Set-Cookie: ${cookieName}=[REDACTED]; ${parts.slice(1).join('; ')}`,
          remediation: `Configure "; HttpOnly" unless this cookie explicitly requires client-side JavaScript access.`,
          references: ['RFC 6265', 'CWE-1004: Sensitive Cookie Without HttpOnly Flag'],
          detectedAt: now,
        });
      }

      // 3. Missing SameSite flag
      if (!sameSitePart) {
        hasIssue = true;
        findings.push({
          id: `fnd_cookie_nosamesite_${Date.now()}_${cookieName}`,
          scanId,
          title: `Cookie "${cookieName}" Missing "SameSite" Attribute`,
          category: 'Session Management',
          severity: 'LOW',
          confidence: 'CONFIRMED',
          affectedResource: `${targetUrl} (Cookie: ${cookieName})`,
          description: `The cookie "${cookieName}" does not declare a SameSite attribute (Strict, Lax, or None).`,
          impact: 'Increases susceptibility to Cross-Site Request Forgery (CSRF) in browsers that do not default to SameSite=Lax.',
          evidence: `Set-Cookie: ${cookieName}=[REDACTED]; ${parts.slice(1).join('; ')}`,
          remediation: `Specify "; SameSite=Lax" or "; SameSite=Strict" for enhanced request origin isolation.`,
          references: ['RFC 6265bis SameSite', 'CWE-1275: Sensitive Cookie with Improper SameSite Attribute'],
          detectedAt: now,
        });
      }

      if (!hasIssue) {
        checksPassed++;
      }
    }

    return { findings, checksCompleted, checksPassed };
  }
}
