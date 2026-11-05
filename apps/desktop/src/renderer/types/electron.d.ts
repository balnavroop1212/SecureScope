import { ElectronAppInfo } from '../../preload';
import {
  SignupDTO,
  LoginDTO,
  AuthResponse,
  User,
  UserPlan,
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
    };
  }
}

export {};
