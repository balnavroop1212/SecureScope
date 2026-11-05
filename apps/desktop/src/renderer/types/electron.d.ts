import { ElectronAppInfo } from '../../preload';

declare global {
  interface Window {
    electronAPI: {
      app: {
        getInfo: () => Promise<ElectronAppInfo>;
      };
    };
  }
}

export {};
