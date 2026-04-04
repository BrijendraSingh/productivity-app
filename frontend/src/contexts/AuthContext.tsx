import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { SafeUser, RegisterRequest, LoginRequest } from '@productivity-app/shared';
import { APP_CONFIG } from '@productivity-app/shared';
import { authApi, setOnUnauthorized } from '../services/api';

interface AuthContextValue {
  user: SafeUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (body: LoginRequest) => Promise<void>;
  register: (body: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(() => {
    const stored = localStorage.getItem(APP_CONFIG.USER_STORAGE_KEY);
    try {
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem(APP_CONFIG.TOKEN_STORAGE_KEY)
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearCredentials = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(APP_CONFIG.TOKEN_STORAGE_KEY);
    localStorage.removeItem(APP_CONFIG.USER_STORAGE_KEY);
  }, []);

  // Wire up the 401 handler in api.ts
  useEffect(() => {
    setOnUnauthorized(clearCredentials);
  }, [clearCredentials]);

  // Verify token on mount
  useEffect(() => {
    async function verify() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await authApi.verify();
        if (res.success && res.data) {
          setUser(res.data.user);
          localStorage.setItem(APP_CONFIG.USER_STORAGE_KEY, JSON.stringify(res.data.user));
        } else {
          clearCredentials();
        }
      } catch {
        clearCredentials();
      } finally {
        setIsLoading(false);
      }
    }
    verify();
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (body: LoginRequest) => {
    setError(null);
    const res = await authApi.login(body);
    if (res.success && res.data) {
      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem(APP_CONFIG.TOKEN_STORAGE_KEY, res.data.token);
      localStorage.setItem(APP_CONFIG.USER_STORAGE_KEY, JSON.stringify(res.data.user));
    } else {
      throw new Error(res.message || 'Login failed');
    }
  }, []);

  const register = useCallback(async (body: RegisterRequest) => {
    setError(null);
    const res = await authApi.register(body);
    if (res.success && res.data) {
      setUser(res.data.user);
      setToken(res.data.token);
      localStorage.setItem(APP_CONFIG.TOKEN_STORAGE_KEY, res.data.token);
      localStorage.setItem(APP_CONFIG.USER_STORAGE_KEY, JSON.stringify(res.data.user));
    } else {
      throw new Error(res.message || 'Registration failed');
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Server-side logout may fail — still clear local state
    }
    clearCredentials();
  }, [clearCredentials]);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!user && !!token,
      isLoading,
      login,
      register,
      logout,
      error,
      clearError,
    }),
    [user, token, isLoading, login, register, logout, error, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
