import React, { createContext, useContext, useState, useCallback } from 'react';
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
  login: (email?: string, password?: string) => Promise<void>;
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

const defaultAnalystUser: AuthUser = {
  id: 'usr_analyst_01',
  email: 'analyst@sentinelflow.io',
  name: 'Lead SOC Analyst',
  role: 'Senior Incident Responder',
  department: 'SecOps Operations',
};

const defaultOpenSession: AuthSession = {
  id: 'sess_open_access',
  createdAt: new Date().toISOString(),
  expiresAt: '2099-01-01T00:00:00.000Z',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Open Access AuthProvider
 * Login, password, and session barriers are completely removed.
 * Unrestricted console access is enabled permanently.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(defaultAnalystUser);
  const [session, setSession] = useState<AuthSession | null>(defaultOpenSession);
  const [token, setToken] = useState<string | null>('analyst_open_access_token');
  const [dbStatus, setDbStatus] = useState<DbStatus | null>({
    connected: true,
    mode: 'unrestricted',
    cluster: 'Console Operational Store',
    lastPingMs: 2,
    error: null,
    hasUriConfigured: true,
    stats: {
      totalUsers: 1,
      activeSessions: 1,
    },
  });

  const refreshDbStatus = useCallback(async () => {
    try {
      const status = await api.getAuthStatus();
      if (status) {
        setDbStatus(status);
      }
    } catch {
      // Retain operational status
    }
  }, []);

  // Password & session login are completely removed - login resolves immediately
  const login = async (email?: string) => {
    if (email) {
      setUser({
        ...defaultAnalystUser,
        email,
        name: email.split('@')[0] || defaultAnalystUser.name,
      });
    }
  };

  const register = async (payload: {
    email: string;
    password: string;
    name: string;
    role?: string;
    department?: string;
  }) => {
    setUser({
      id: `usr_${Date.now()}`,
      email: payload.email,
      name: payload.name || defaultAnalystUser.name,
      role: payload.role || defaultAnalystUser.role,
      department: payload.department || defaultAnalystUser.department,
    });
  };

  // Logout does not lock out the user, preserves analyst access
  const logout = async () => {
    setUser(defaultAnalystUser);
    setSession(defaultOpenSession);
    setToken('analyst_open_access_token');
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
        isAuthenticated: true,
        isLoading: false,
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
