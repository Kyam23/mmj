/**
 * Auth Context with Real Session Handling and Instant Role Switcher
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api, setStoredToken, getStoredToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<{
    require_verification?: boolean;
    user_id?: string;
    email?: string;
    demo_code?: string;
    message?: string;
    token?: string;
    user?: User;
  }>;
  verifyEmail: (userId: string, email: string, code: string) => Promise<User>;
  resendVerificationCode: (userId?: string, email?: string) => Promise<string>;
  logout: () => void;
  switchRoleDemo: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Quick demo role credentials for instant switching
const DEMO_CREDENTIALS: Record<UserRole, { identifier: string; label: string }> = {
  admin: { identifier: 'captain.degamo', label: 'Barangay Captain (Admin)' },
  collector: { identifier: 'collector.danilo', label: 'Garbage Collector' },
  leader: { identifier: 'leader.rolando', label: 'Purok Leader (Purok Mangga)' },
  resident: { identifier: 'resident.maria', label: 'Barangay Resident' }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const token = getStoredToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const me = await api.getMe();
      setUser(me);
    } catch (err) {
      console.warn('Session verification failed, logging out:', err);
      setStoredToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      // Don't auto-login if token was cleared so the public landing page is accessible
      setUser(null);
      setLoading(false);
    } else {
      refreshUser();
    }
  }, []);

  const login = async (identifier: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.login(identifier, password);
      setStoredToken(res.token);
      setUser(res.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: any) => {
    setLoading(true);
    try {
      const res = await api.register(payload);
      if (res.token && res.user) {
        setStoredToken(res.token);
        setUser(res.user);
      }
      return res;
    } finally {
      setLoading(false);
    }
  };

  const verifyEmail = async (userId: string, email: string, code: string) => {
    setLoading(true);
    try {
      const res = await api.verifyEmail({ user_id: userId, email, code });
      setStoredToken(res.token);
      setUser(res.user);
      return res.user;
    } finally {
      setLoading(false);
    }
  };

  const resendVerificationCode = async (userId?: string, email?: string) => {
    const res = await api.resendVerificationCode({ user_id: userId, email });
    return res.demo_code;
  };

  const logout = () => {
    setStoredToken(null);
    setUser(null);
  };

  const switchRoleDemo = async (role: UserRole) => {
    setLoading(true);
    try {
      const cred = DEMO_CREDENTIALS[role];
      const res = await api.login(cred.identifier, 'Password123!');
      setStoredToken(res.token);
      setUser(res.user);
    } catch (err) {
      console.error('Failed to switch role:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        verifyEmail,
        resendVerificationCode,
        logout,
        switchRoleDemo,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
