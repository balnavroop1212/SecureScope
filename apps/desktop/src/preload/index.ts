import { contextBridge, ipcRenderer } from 'electron';
import type {
  SignupDTO,
  LoginDTO,
  AuthResponse,
  User,
  UserPlan,
} from '@shared/types';

export interface ElectronAppInfo {
  name: string;
  version: string;
  platform: string;
  isPackaged: boolean;
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
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
