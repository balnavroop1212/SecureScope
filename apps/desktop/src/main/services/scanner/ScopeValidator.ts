import * as dns from 'dns';
import { URL } from 'url';

export interface ValidatedScope {
  normalizedUrl: string;
  normalizedTarget: string;
  hostname: string;
  protocol: 'http:' | 'https:';
  port: number;
  ip: string;
  isDemo: boolean;
}

export class ScopeValidator {
  /**
   * Validates target URL scheme, resolves DNS, enforces SSRF protections,
   * and handles local sandbox demo mode isolation.
   */
  public static async validateScope(
    rawUrl: string,
    isDemoMode: boolean = false
  ): Promise<ValidatedScope> {
    let candidate = rawUrl.trim();
    if (!candidate.startsWith('http://') && !candidate.startsWith('https://')) {
      candidate = `https://${candidate}`;
    }

    let parsed: URL;
    try {
      parsed = new URL(candidate);
    } catch {
      throw new Error(`Invalid URL format: "${rawUrl}". Please enter a valid web domain or address.`);
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error(`Disallowed protocol "${parsed.protocol}". Only HTTP and HTTPS targets are permitted.`);
    }

    const hostname = parsed.hostname;
    const protocol = parsed.protocol as 'http:' | 'https:';
    const port = parsed.port
      ? parseInt(parsed.port, 10)
      : protocol === 'https:'
      ? 443
      : 80;

    // Resolve IP address via DNS lookup
    let ip = '';
    try {
      const lookup = await dns.promises.lookup(hostname);
      ip = lookup.address;
    } catch (err: any) {
      // If localhost in demo mode, resolve to 127.0.0.1
      if (hostname === 'localhost' && isDemoMode) {
        ip = '127.0.0.1';
      } else {
        throw new Error(
          `DNS resolution failed for "${hostname}". Target host could not be reached or does not exist.`
        );
      }
    }

    const isPrivateOrLoopback = this.isPrivateIp(ip);

    if (isPrivateOrLoopback) {
      if (!isDemoMode) {
        throw new Error(
          `SSRF Protection Guard: Target "${hostname}" resolves to private/loopback IP (${ip}). ` +
          `External scanning of local networks is blocked. Toggle "Sandbox Active" mode for local mock assessments.`
        );
      }
    }

    const normalizedTarget = `${hostname}${port !== 80 && port !== 443 ? `:${port}` : ''}`;
    const normalizedUrl = `${protocol}//${normalizedTarget}${parsed.pathname === '/' ? '' : parsed.pathname}`;

    return {
      normalizedUrl,
      normalizedTarget,
      hostname,
      protocol,
      port,
      ip,
      isDemo: isDemoMode || isPrivateOrLoopback,
    };
  }

  /**
   * Inspects IPv4 and IPv6 addresses against RFC1918, loopback, and link-local ranges.
   */
  private static isPrivateIp(ip: string): boolean {
    if (ip === 'localhost' || ip === '::1') return true;

    // IPv4 checks
    const parts = ip.split('.').map((p) => parseInt(p, 10));
    if (parts.length === 4 && parts.every((n) => !isNaN(n) && n >= 0 && n <= 255)) {
      // 127.0.0.0/8 (Loopback)
      if (parts[0] === 127) return true;
      // 10.0.0.0/8 (RFC1918)
      if (parts[0] === 10) return true;
      // 172.16.0.0/12 (RFC1918)
      if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
      // 192.168.0.0/16 (RFC1918)
      if (parts[0] === 192 && parts[1] === 168) return true;
      // 169.254.0.0/16 (Link-local / Cloud metadata)
      if (parts[0] === 169 && parts[1] === 254) return true;
      // 0.0.0.0/8
      if (parts[0] === 0) return true;
    }

    // IPv6 Unique local / Link-local
    if (ip.startsWith('fc') || ip.startsWith('fd') || ip.startsWith('fe80')) {
      return true;
    }

    return false;
  }
}
