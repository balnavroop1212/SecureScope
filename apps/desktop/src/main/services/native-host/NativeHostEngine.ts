import { LocalAuthRepository } from '../auth/LocalAuthRepository';
import { SQLiteScanRepository } from '../storage/SQLiteScanRepository';
import { ScannerEngine } from '../scanner/ScannerEngine';
import { EntitlementService } from '../auth/EntitlementService';
import type { ScanMode } from '@shared/types';

export interface HandleMessageResult {
  response: Record<string, any>;
  closeAfterSend?: boolean;
}

export class NativeHostEngine {
  private authRepo: LocalAuthRepository;
  private scanRepo: SQLiteScanRepository;
  private scanner: ScannerEngine;

  constructor(
    customDataDir?: string,
    customScanRepo?: SQLiteScanRepository,
    customAuthRepo?: LocalAuthRepository
  ) {
    this.authRepo = customAuthRepo || new LocalAuthRepository(customDataDir);
    this.scanRepo = customScanRepo || new SQLiteScanRepository(customDataDir);
    this.scanner = new ScannerEngine(this.scanRepo);
  }

  public getScanRepository(): SQLiteScanRepository {
    return this.scanRepo;
  }

  public getAuthRepository(): LocalAuthRepository {
    return this.authRepo;
  }

  /**
   * Process a message incoming from the Chrome Extension.
   */
  public async handleMessage(msg: Record<string, any>): Promise<HandleMessageResult> {
    const type = msg?.type || msg?.action;

    switch (type) {
      case 'PING':
        return {
          response: {
            type: 'PONG',
            success: true,
            timestamp: Date.now(),
            service: 'com.securescope.desktop',
            version: '1.0.0',
          },
        };

      case 'GET_STATUS':
        return await this.handleGetStatus();

      case 'START_SCAN':
      case 'REQUEST_SCAN':
        return await this.handleStartScan(msg);

      default:
        return {
          response: {
            type: 'ERROR',
            success: false,
            error: `Unrecognized message type: "${type}"`,
          },
        };
    }
  }

  private async handleGetStatus(): Promise<HandleMessageResult> {
    try {
      const session = await this.authRepo.getCurrentSession();
      if (!session) {
        return {
          response: {
            type: 'STATUS_RESPONSE',
            success: true,
            connected: true,
            authenticated: false,
            user: null,
            canScan: false,
            version: '1.0.0',
          },
        };
      }

      const user = await this.authRepo.getUserById(session.userId);
      if (!user) {
        return {
          response: {
            type: 'STATUS_RESPONSE',
            success: true,
            connected: true,
            authenticated: false,
            user: null,
            canScan: false,
            version: '1.0.0',
          },
        };
      }

      const canScan = EntitlementService.canUseCompanionExtension(user.plan);

      return {
        response: {
          type: 'STATUS_RESPONSE',
          success: true,
          connected: true,
          authenticated: true,
          user: {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`.trim(),
            email: user.email,
            plan: user.plan,
          },
          canScan,
          version: '1.0.0',
        },
      };
    } catch (err: any) {
      return {
        response: {
          type: 'STATUS_RESPONSE',
          success: false,
          connected: true,
          error: `Error checking status: ${err.message}`,
        },
      };
    }
  }

  private async handleStartScan(msg: Record<string, any>): Promise<HandleMessageResult> {
    const { url, mode = 'normal', authorizedScopeConfirmed = false } = msg;

    try {
      // 1. Verify user session
      const session = await this.authRepo.getCurrentSession();
      if (!session) {
        return {
          response: {
            type: 'SCAN_ERROR',
            success: false,
            error: 'Authentication required. Please log into the SecureScope desktop application.',
          },
        };
      }

      const user = await this.authRepo.getUserById(session.userId);
      if (!user) {
        return {
          response: {
            type: 'SCAN_ERROR',
            success: false,
            error: 'Active session is invalid. Please re-authenticate in SecureScope.',
          },
        };
      }

      // 2. Validate Companion Extension entitlement
      if (!EntitlementService.canUseCompanionExtension(user.plan)) {
        return {
          response: {
            type: 'SCAN_ERROR',
            success: false,
            error: 'The Companion Chrome Extension requires a SecureScope Pro subscription (₹299 + GST).',
            upgradeRequired: true,
          },
        };
      }

      // 3. Validate Scan Mode entitlement
      const scanMode: ScanMode = mode;
      if (!EntitlementService.canExecuteScanMode(user.plan, scanMode)) {
        return {
          response: {
            type: 'SCAN_ERROR',
            success: false,
            error: `Scan mode "${scanMode}" requires an active SecureScope Pro subscription.`,
            upgradeRequired: true,
          },
        };
      }

      // 4. Verify scope authorization declaration
      if (!authorizedScopeConfirmed) {
        return {
          response: {
            type: 'SCAN_ERROR',
            success: false,
            error: 'Scope authorization confirmation required. You must declare permission to test the target.',
          },
        };
      }

      // 5. Ensure Scan Repository is initialized
      await this.scanRepo.initialize();

      // 6. Execute assessment via ScannerEngine
      const report = await this.scanner.startScan({
        userId: user.id,
        url,
        scanMode,
        authorizedScopeConfirmed: true,
        isDemoMode: Boolean(msg.isDemoMode),
      });

      const score = report.scan.postureScore;
      const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';

      return {
        response: {
          type: 'SCAN_COMPLETE',
          success: true,
          scanId: report.scanId,
          targetUrl: report.scan.targetUrl,
          timestamp: report.scan.startedAt,
          scanMode: report.scan.scanMode,
          isDemo: report.scan.isDemo,
          score,
          grade,
          totalFindings: report.findings.length,
          severityCounts: report.findingCounts,
          executiveSummary: report.executiveSummary,
          message: 'Website security assessment completed successfully. View full technical details in SecureScope.',
        },
      };
    } catch (err: any) {
      return {
        response: {
          type: 'SCAN_ERROR',
          success: false,
          error: err.message || 'An unexpected error occurred during assessment execution.',
        },
      };
    }
  }
}
