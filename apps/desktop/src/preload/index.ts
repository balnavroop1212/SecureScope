import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import type {
  SignupDTO,
  LoginDTO,
  AuthResponse,
  User,
  UserPlan,
  ScanMode,
  ScanReport,
  ScanRecord,
  ScanProgressEvent,
  DashboardMetrics,
} from '@shared/types';

export interface ElectronAppInfo {
  name: string;
  version: string;
  platform: string;
  isPackaged: boolean;
}

export interface StartScanIPCRequest {
  url: string;
  scanMode: ScanMode;
  authorizedScopeConfirmed: boolean;
  isDemoMode?: boolean;
}

const electronAPI = {
  app: {
    getInfo: (): Promise<ElectronAppInfo> => ipcRenderer.invoke('app:getInfo'),
  },
  auth: {
    signup: (data: SignupDTO): Promise<AuthResponse> =>
      ipcRenderer.invoke('auth:signup', data),
    login: (data: LoginDTO): Promise<AuthResponse> =>
      ipcRenderer.invoke('auth:login', data),
    getCurrentUser: (): Promise<User | null> =>
      ipcRenderer.invoke('auth:getCurrentUser'),
    updateProfile: (updates: { firstName?: string; lastName?: string }): Promise<User> =>
      ipcRenderer.invoke('auth:updateProfile', updates),
    updatePlan: (plan: UserPlan): Promise<User> =>
      ipcRenderer.invoke('auth:updatePlan', plan),
    logout: (): Promise<void> => ipcRenderer.invoke('auth:logout'),
  },
  scanner: {
    startScan: (data: StartScanIPCRequest): Promise<ScanReport> =>
      ipcRenderer.invoke('scanner:startScan', data),
    cancelScan: (scanId: string): Promise<boolean> =>
      ipcRenderer.invoke('scanner:cancelScan', scanId),
    onProgress: (callback: (progress: ScanProgressEvent) => void): (() => void) => {
      const listener = (_event: IpcRendererEvent, progress: ScanProgressEvent) => {
        callback(progress);
      };
      ipcRenderer.on('scanner:progress', listener);
      return () => {
        ipcRenderer.removeListener('scanner:progress', listener);
      };
    },
  },
  reports: {
    getDashboardMetrics: (): Promise<DashboardMetrics> =>
      ipcRenderer.invoke('reports:getDashboardMetrics'),
    getHistory: (): Promise<ScanRecord[]> =>
      ipcRenderer.invoke('reports:getHistory'),
    getReport: (scanId: string): Promise<ScanReport | null> =>
      ipcRenderer.invoke('reports:getReport', scanId),
    deleteScan: (scanId: string): Promise<boolean> =>
      ipcRenderer.invoke('reports:deleteScan', scanId),
    exportPdf: (scanId: string): Promise<{ success: boolean; filePath?: string; error?: string }> =>
      ipcRenderer.invoke('reports:exportPdf', scanId),
  },
  extension: {
    getStatus: (): Promise<any> => ipcRenderer.invoke('extension:getStatus'),
    registerHost: (extensionId?: string): Promise<any> =>
      ipcRenderer.invoke('extension:registerHost', extensionId),
    testEcho: (payload: any): Promise<any> =>
      ipcRenderer.invoke('extension:testEcho', payload),
  },
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
