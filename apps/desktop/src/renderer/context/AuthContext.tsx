import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginDTO, SignupDTO, UserPlan } from '@shared/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginDTO) => Promise<{ success: boolean; error?: string }>;
  signup: (data: SignupDTO) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updatePlan: (plan: UserPlan) => Promise<void>;
  updateProfile: (updates: { firstName?: string; lastName?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate user session on app launch
  useEffect(() => {
    let isMounted = true;
    async function initAuth() {
      try {
        if (window.electronAPI?.auth) {
          const current = await window.electronAPI.auth.getCurrentUser();
          if (isMounted) {
            setUser(current);
          }
        }
      } catch (err) {
        console.error('[AuthContext] Failed to retrieve current user session:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    initAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: LoginDTO) => {
    setIsLoading(true);
    try {
      const res = await window.electronAPI.auth.login(credentials);
      if (res.success && res.user) {
        setUser(res.user);
        return { success: true };
      }
      return { success: false, error: res.error || 'Authentication failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Internal error during login' };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (data: SignupDTO) => {
    setIsLoading(true);
    try {
      const res = await window.electronAPI.auth.signup(data);
      if (res.success) {
        return { success: true };
      }
      return { success: false, error: res.error || 'Registration failed' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Internal error during registration' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await window.electronAPI.auth.logout();
      setUser(null);
    } catch (err) {
      console.error('[AuthContext] Error during logout:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updatePlan = async (plan: UserPlan) => {
    if (!user) return;
    try {
      const updated = await window.electronAPI.auth.updatePlan(plan);
      setUser(updated);
    } catch (err) {
      console.error('[AuthContext] Failed to update plan:', err);
    }
  };

  const updateProfile = async (updates: { firstName?: string; lastName?: string }) => {
    if (!user) return;
    try {
      const updated = await window.electronAPI.auth.updateProfile(updates);
      setUser(updated);
    } catch (err) {
      console.error('[AuthContext] Failed to update profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updatePlan,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
