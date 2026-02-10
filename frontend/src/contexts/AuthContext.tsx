'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, getCurrentUser, login as apiLogin, logout as apiLogout, signup as apiSignup, clearTokens, getTokens } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, username: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const { accessToken } = getTokens();
      if (!accessToken) {
        setUser(null);
        return;
      }
      const userData = await getCurrentUser();
      setUser(userData);
    } catch {
      setUser(null);
      clearTokens();
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      try {
        const { accessToken } = getTokens();
        if (!accessToken) {
          if (isMounted) setUser(null);
          return;
        }
        const userData = await getCurrentUser();
        if (isMounted) setUser(userData);
      } catch {
        if (isMounted) {
          setUser(null);
          clearTokens();
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initAuth();
    
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const result = await apiLogin(email, password);
    if (result.success && result.data) {
      setUser(result.data.user);
      return { success: true };
    }
    return { success: false, error: result.error || 'Login failed' };
  };

  const signup = async (email: string, password: string, username: string, displayName?: string) => {
    const result = await apiSignup(email, password, username, displayName);
    if (result.success) {
      return { success: true };
    }
    return { success: false, error: result.error || 'Signup failed' };
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
