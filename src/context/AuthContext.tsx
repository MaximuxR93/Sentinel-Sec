import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, AuthUser, AuthSession } from '../lib/api-client';

export interface DbStatus {
  connected: boolean;
  mode: string;
  cluster: string;
  lastPingMs: number;
  error: string | null;
  hasUriConfigured: boolean;
  stats: {
    totalUsers: number;
    activeSessions: number;
  };
}

interface AuthContextType {
  user: AuthUser | null;
  session: AuthSession | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  dbStatus: DbStatus | null;
  login: (email: string, password?: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    name: string;
    role?: string;
    department?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  connectAtlas: (uri: string) => Promise<{ success: boolean; message: string; cluster?: string }>;
  refreshDbStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sentinelflow_auth_token');
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);

  const refreshDbStatus = useCallback(async () => {
    try {
      const status = await api.getAuthStatus();
      setDbStatus(status);
    } catch (err) {
      console.warn('Failed to refresh db status', err);
    }
  }, []);

  // Verify session on mount
  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      setIsLoading(true);
      try {
        const storedToken = localStorage.getItem('sentinelflow_auth_token');
        if (storedToken) {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (mounted) {
              setUser(data.user);
              setSession(data.session);
              setToken(storedToken);
            }
          } else {
            // Token invalid or expired
            if (mounted) {
              localStorage.removeItem('sentinelflow_auth_token');
              localStorage.removeItem('sentinelflow_session_id');
              setUser(null);
              setSession(null);
              setToken(null);
            }
          }
        }
      } catch {
        if (mounted) {
          setUser(null);
          setSession(null);
          setToken(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
      refreshDbStatus();
    }

    checkAuth();
    return () => {
      mounted = false;
    };
  }, [refreshDbStatus]);

  const login = async (email: string, password = 'Password123!') => {
    setIsLoading(true);
    try {
      const result = await api.login(email, password);
      setUser(result.user);
      setSession(result.session);
      setToken(result.token);
      await refreshDbStatus();
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: {
    email: string;
    password: string;
    name: string;
    role?: string;
    department?: string;
  }) => {
    setIsLoading(true);
    try {
      const result = await api.register(payload);
      setUser(result.user);
      setSession(result.session);
      setToken(result.token);
      await refreshDbStatus();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
      setUser(null);
      setSession(null);
      setToken(null);
      await refreshDbStatus();
    } finally {
      setIsLoading(false);
    }
  };

  const connectAtlas = async (uri: string) => {
    const res = await api.configureDb(uri);
    await refreshDbStatus();
    return res;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        dbStatus,
        login,
        register,
        logout,
        connectAtlas,
        refreshDbStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
