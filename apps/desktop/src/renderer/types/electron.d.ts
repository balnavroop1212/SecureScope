import { ElectronAppInfo, StartScanIPCRequest } from '../../preload';
import type {
  SignupDTO,
  LoginDTO,
  AuthResponse,
  User,
  UserPlan,
  ScanReport,
  ScanRecord,
  ScanProgressEvent,
  DashboardMetrics,
} from '@shared/types';

declare global {
  interface Window {
    electronAPI: {
      app: {
        getInfo: () => Promise<ElectronAppInfo>;
      };
      auth: {
        signup: (data: SignupDTO) => Promise<AuthResponse>;
        login: (data: LoginDTO) => Promise<AuthResponse>;
        getCurrentUser: () => Promise<User | null>;
        updateProfile: (updates: { firstName?: string; lastName?: string }) => Promise<User>;
        updatePlan: (plan: UserPlan) => Promise<User>;
        logout: () => Promise<void>;
      };
      scanner: {
        startScan: (data: StartScanIPCRequest) => Promise<ScanReport>;
        cancelScan: (scanId: string) => Promise<boolean>;
        onProgress: (callback: (progress: ScanProgressEvent) => void) => () => void;
      };
      reports: {
        getDashboardMetrics: () => Promise<DashboardMetrics>;
        getHistory: () => Promise<ScanRecord[]>;
        getReport: (scanId: string) => Promise<ScanReport | null>;
        deleteScan: (scanId: string) => Promise<boolean>;
        exportPdf: (scanId: string) => Promise<{ success: boolean; filePath?: string; error?: string }>;
      };
      extension: {
        getStatus: () => Promise<{
          isWindows: boolean;
          manifestExists: boolean;
          batExists: boolean;
          registryKeyExists: boolean;
          isFullyConfigured: boolean;
          hostDir: string;
          manifestPath: string;
          batPath: string;
          hostId: string;
          userPlan: UserPlan;
          canUseExtension: boolean;
        }>;
        registerHost: (extensionId?: string) => Promise<{
          success: boolean;
          hostDir: string;
          manifestPath: string;
          batPath: string;
          registryStatus: string;
        }>;
        testEcho: (payload: any) => Promise<{
          success: boolean;
          roundTripBytes: number;
          decoded: any;
        }>;
      };
    };
  }
}

export {};
