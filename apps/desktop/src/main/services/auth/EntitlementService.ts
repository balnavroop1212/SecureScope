import { UserPlan, ScanMode } from '@shared/types';

export class EntitlementService {
  /**
   * Validates whether a user plan is authorized to initiate a specific scan mode.
   * Enforced in the Main process so UI modifications cannot bypass plan restrictions.
   */
  public static canExecuteScanMode(plan: UserPlan, mode: ScanMode): boolean {
    if (mode === 'normal') {
      return true; // Free tier can execute normal scan
    }
    // Aggressive and Private modes require premium
    return plan === 'premium';
  }

  /**
   * Validates whether a user plan is permitted to download executive PDF reports.
   */
  public static canDownloadPdf(plan: UserPlan): boolean {
    return plan === 'premium';
  }

  /**
   * Validates whether companion Chrome extension integration is enabled for user.
   */
  public static canUseCompanionExtension(plan: UserPlan): boolean {
    return plan === 'premium';
  }
}
