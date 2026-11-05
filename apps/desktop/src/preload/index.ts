import { contextBridge, ipcRenderer } from 'electron';

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
  // Future channels for Auth, Scanner, Reports, Subscriptions will be registered here
};

contextBridge.exposeInMainWorld('electronAPI', electronAPI);
