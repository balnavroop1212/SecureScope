import { Finding } from '@shared/types';

export interface InfoDisclosureCheckResult {
  findings: Finding[];
  checksCompleted: number;
  checksPassed: number;
}

export class InfoDisclosureCheck {
  public static execute(
    headers: Record<string, string | string[] | undefined>,
    targetUrl: string,
    scanId: string
  ): InfoDisclosureCheckResult {
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

    // 1. Server Header Banner Disclosure
    checksCompleted++;
    const serverHeader = getHeader('Server');
    if (serverHeader) {
      // Disclosing detailed version info (e.g. Apache/2.4.41, nginx/1.18.0)
      const hasDetailedVersion = /[\d.]+/.test(serverHeader);
      if (hasDetailedVersion) {
        findings.push({
          id: `fnd_info_server_${Date.now()}`,
          scanId,
          title: 'Detailed Web Server Software Version Disclosed',
          category: 'Information Disclosure',
          severity: 'LOW',
          confidence: 'CONFIRMED',
          affectedResource: targetUrl,
          description: `The Server response header reveals detailed technology and version information: "${serverHeader}".`,
          impact: 'Adversaries can search vulnerability databases (CVE/NVD) for unpatched flaws specific to this exact version.',
          evidence: `Server: ${serverHeader}`,
          remediation: 'Configure your web server to suppress or genericize the Server banner (e.g. "ServerTokens Prod" in Apache).',
          references: ['CWE-200: Information Exposure', 'OWASP WSTG-INFO-02'],
          detectedAt: now,
        });
      } else {
        checksPassed++;
      }
    } else {
      checksPassed++;
    }

    // 2. X-Powered-By Header Disclosure
    checksCompleted++;
    const xPoweredBy = getHeader('X-Powered-By');
    if (xPoweredBy) {
      findings.push({
        id: `fnd_info_powered_${Date.now()}`,
        scanId,
        title: 'Backend Framework Disclosed via X-Powered-By',
        category: 'Information Disclosure',
        severity: 'LOW',
        confidence: 'CONFIRMED',
        affectedResource: targetUrl,
        description: `The HTTP response advertises the backend application framework: "${xPoweredBy}".`,
        impact: 'Aids attackers in fingerprinting technology stacks to focus reconnaissance on platform-specific attack vectors.',
        evidence: `X-Powered-By: ${xPoweredBy}`,
        remediation: 'Disable the X-Powered-By header (e.g. app.disable("x-powered-by") in Express, expose_php = Off in php.ini).',
        references: ['CWE-200: Information Exposure', 'OWASP WSTG-INFO-08'],
        detectedAt: now,
      });
    } else {
      checksPassed++;
    }

    return { findings, checksCompleted, checksPassed };
  }
}
