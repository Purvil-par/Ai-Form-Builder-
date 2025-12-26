/**
 * Authentication Context
 * Global state management for user authentication
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as authService from '../api/authService';
import type { User, LoginCredentials, RegisterData, GoogleAuthRequest } from '../api/authService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  loginWithGoogle: (request: GoogleAuthRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem('access_token');
      
      if (accessToken) {
        try {
          const userData = await authService.getCurrentUser(accessToken);
          setUser(userData);
        } catch (error) {
          console.error('Failed to restore session:', error);
          // Try to refresh token
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            try {
              const response = await authService.refreshToken(refreshToken);
              localStorage.setItem('access_token', response.access_token);
              localStorage.setItem('refresh_token', response.refresh_token);
              setUser(response.user);
            } catch (refreshError) {
              // Refresh failed, clear tokens
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
            }
          }
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Auto-refresh token before expiry
  useEffect(() => {
    if (!user) return;

    // Refresh token every 25 minutes (tokens expire in 30 minutes)
    const interval = setInterval(async () => {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await authService.refreshToken(refreshToken);
          localStorage.setItem('access_token', response.access_token);
          localStorage.setItem('refresh_token', response.refresh_token);
          setUser(response.user);
        } catch (error) {
          console.error('Token refresh failed:', error);
          // Logout on refresh failure
          await logout();
        }
      }
    }, 25 * 60 * 1000); // 25 minutes

    return () => clearInterval(interval);
  }, [user]);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await authService.register(data);
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const loginWithGoogle = async (request: GoogleAuthRequest) => {
    try {
      const response = await authService.googleAuth(request);
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      await authService.logout(accessToken);
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
  };

  const refreshAuth = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await authService.refreshToken(refreshToken);
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('refresh_token', response.refresh_token);
      setUser(response.user);
    } catch (error) {
      // Refresh failed, logout
      await logout();
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    loginWithGoogle,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
