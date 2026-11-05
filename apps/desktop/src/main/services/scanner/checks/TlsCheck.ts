import * as tls from 'tls';
import { Finding } from '@shared/types';

export interface TlsCheckResult {
  findings: Finding[];
  checksCompleted: number;
  checksPassed: number;
  details: {
    issuer?: string;
    subject?: string;
    validTo?: string;
    daysRemaining?: number;
    protocol?: string;
    cipher?: string;
  };
}

export class TlsCheck {
  public static async execute(
    hostname: string,
    port: number = 443,
    scanId: string,
    timeoutMs: number = 8000
  ): Promise<TlsCheckResult> {
    const findings: Finding[] = [];
    let checksCompleted = 0;
    let checksPassed = 0;
    const now = new Date();

    return new Promise((resolve) => {
      const socket = tls.connect(
        {
          host: hostname,
          port,
          servername: hostname,
          rejectUnauthorized: false, // passive inspection: we inspect cert details directly
          timeout: timeoutMs,
        },
        () => {
          checksCompleted++;
          const cert = socket.getPeerCertificate(true);
          const protocol = socket.getProtocol() || 'Unknown';
          const cipher = socket.getCipher()?.name || 'Unknown';

          if (!cert || Object.keys(cert).length === 0) {
            findings.push({
              id: `fnd_tls_nocert_${Date.now()}`,
              scanId,
              title: 'No TLS Certificate Provided',
              category: 'Cryptography',
              severity: 'CRITICAL',
              confidence: 'CONFIRMED',
              affectedResource: `https://${hostname}:${port}`,
              description: 'The server accepts TLS connections but failed to return a valid peer certificate.',
              impact: 'Man-in-the-middle attackers can intercept, modify, or eavesdrop on all transmitted traffic.',
              evidence: `TLS handshake completed with protocol: ${protocol}, but certificate object is empty.`,
              remediation: 'Install and configure a trusted, valid TLS certificate signed by a recognized Certificate Authority.',
              references: ['CWE-295: Improper Certificate Validation', 'OWASP A02:2021-Cryptographic Failures'],
              detectedAt: now.toISOString(),
            });
            socket.destroy();
            return resolve({
              findings,
              checksCompleted,
              checksPassed,
              details: { protocol, cipher },
            });
          }

          const validTo = new Date(cert.valid_to);
          const daysRemaining = Math.floor(
            (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
          );

          const formatField = (val: string | string[] | undefined): string => {
            if (!val) return 'Unknown';
            return Array.isArray(val) ? val.join(', ') : val;
          };

          const issuer = formatField(cert.issuer?.O || cert.issuer?.CN);
          const subject = formatField(cert.subject?.CN);

          // 1. Check for expired certificate
          if (daysRemaining < 0) {
            findings.push({
              id: `fnd_tls_expired_${Date.now()}`,
              scanId,
              title: 'Expired SSL/TLS Certificate',
              category: 'Cryptography',
              severity: 'CRITICAL',
              confidence: 'CONFIRMED',
              affectedResource: `https://${hostname}:${port}`,
              description: `The SSL/TLS certificate expired on ${cert.valid_to} (${Math.abs(daysRemaining)} days ago).`,
              impact: 'Web browsers will display severe security warnings, blocking normal user access.',
              evidence: `Certificate Subject: ${subject}\nIssuer: ${issuer}\nValid To: ${cert.valid_to}`,
              remediation: 'Renew and deploy a current SSL/TLS certificate immediately using Let\'s Encrypt or your Certificate Authority.',
              references: ['CWE-298: Improper Validation of Certificate Expiration Date', 'RFC 5280'],
              detectedAt: now.toISOString(),
            });
          } else if (daysRemaining <= 14) {
            findings.push({
              id: `fnd_tls_expiring_${Date.now()}`,
              scanId,
              title: 'SSL/TLS Certificate Expiring Soon',
              category: 'Cryptography',
              severity: 'MEDIUM',
              confidence: 'CONFIRMED',
              affectedResource: `https://${hostname}:${port}`,
              description: `The certificate is due to expire in ${daysRemaining} days (on ${cert.valid_to}).`,
              impact: 'Failure to renew will result in service outage and browser warning errors.',
              evidence: `Expiration Date: ${cert.valid_to} (${daysRemaining} days remaining)`,
              remediation: 'Trigger automated certificate renewal via ACME / certbot prior to expiration.',
              references: ['RFC 5280'],
              detectedAt: now.toISOString(),
            });
          } else {
            checksPassed++;
          }

          // 2. Check for legacy/deprecated TLS version (TLSv1.0 or TLSv1.1)
          if (protocol === 'TLSv1' || protocol === 'TLSv1.1') {
            checksCompleted++;
            findings.push({
              id: `fnd_tls_legacy_${Date.now()}`,
              scanId,
              title: 'Deprecated TLS Protocol Version Supported',
              category: 'Cryptography',
              severity: 'HIGH',
              confidence: 'CONFIRMED',
              affectedResource: `https://${hostname}:${port}`,
              description: `The server supports ${protocol}, which was formally deprecated by the IETF in RFC 8996 due to known cryptographic weaknesses.`,
              impact: 'Legacy TLS versions are susceptible to cipher downgrade attacks and BEAST/POODLE vulnerabilities.',
              evidence: `Negotiated Protocol: ${protocol}\nCipher Suite: ${cipher}`,
              remediation: 'Disable TLS 1.0 and TLS 1.1 on the web server configuration; enforce TLS 1.2 and TLS 1.3 only.',
              references: ['RFC 8996: Deprecating TLS 1.0 and TLS 1.1', 'CWE-326: Inadequate Encryption Strength'],
              detectedAt: now.toISOString(),
            });
          } else {
            checksPassed++;
          }

          socket.destroy();
          resolve({
            findings,
            checksCompleted,
            checksPassed,
            details: {
              issuer,
              subject,
              validTo: cert.valid_to,
              daysRemaining,
              protocol,
              cipher,
            },
          });
        }
      );

      socket.on('timeout', () => {
        socket.destroy();
        resolve({
          findings,
          checksCompleted,
          checksPassed,
          details: {},
        });
      });

      socket.on('error', () => {
        socket.destroy();
        resolve({
          findings,
          checksCompleted,
          checksPassed,
          details: {},
        });
      });
    });
  }
}
