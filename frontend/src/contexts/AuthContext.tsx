'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, getCurrentUser, login as apiLogin, logout as apiLogout, signup as apiSignup, clearTokens, getTokens, setTokens } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, username: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  followingIds: Set<string>;
  isFollowing: (userId: string) => boolean;
  updateFollowing: (userId: string, isFollowing: boolean) => void;
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
      
      // Fetch following IDs
      if (userData) {
        const ids = await import('@/lib/api').then(m => m.getMyFollowingIds());
        setFollowingIds(new Set(ids));
      }
    } catch {
      setUser(null);
      setFollowingIds(new Set());
      clearTokens();
    }
  }, []);

  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  const isFollowing = useCallback((userId: string) => {
      return followingIds.has(userId);
  }, [followingIds]);

  const updateFollowing = useCallback((userId: string, status: boolean) => {
      setFollowingIds(prev => {
          const next = new Set(prev);
          if (status) next.add(userId);
          else next.delete(userId);
          return next;
      });
  }, []);

  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      try {
        const { accessToken, refreshToken } = getTokens();
        if (!accessToken) {
          if (isMounted) setUser(null);
          return;
        }

        // Sync cookie for SSR (in case it's missing but LS has it)
        if (accessToken && refreshToken) {
            setTokens(accessToken, refreshToken);
        }

        const userData = await getCurrentUser();
        if (isMounted) {
            setUser(userData);
            if (userData) {
                const ids = await import('@/lib/api').then(m => m.getMyFollowingIds());
                if (isMounted) setFollowingIds(new Set(ids));
            }
        }
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
    await apiLogout();
    setUser(null);
    setFollowingIds(new Set());
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
        followingIds,
        isFollowing,
        updateFollowing,
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
