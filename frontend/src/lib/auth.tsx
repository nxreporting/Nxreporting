'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from './api';
import { User, AuthResponse } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (email: string, password: string, name: string) => Promise<AuthResponse>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const initAuth = async () => {
      // Prevent running on server-side
      if (typeof window === 'undefined') {
        if (isMounted) setLoading(false);
        return;
      }
      
      try {
        const token = localStorage.getItem('token');
        if (token && isMounted) {
          try {
            const response = await api.get('/auth/me');
            if (isMounted && response.data.success) {
              setUser(response.data.data.user);
            } else if (isMounted) {
              localStorage.removeItem('token');
            }
          } catch (error) {
            console.error('Auth initialization error:', error);
            if (isMounted) {
              localStorage.removeItem('token');
            }
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only run once

  const login = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    try {
      // Use simple login for testing (no Supabase required)
      const response = await api.post('/auth/login-simple', { email, password });
      if (response.data.success) {
        const { user, token } = response.data.data;
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
        }
        setUser(user);
      }
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: { message: error.response?.data?.error?.message || 'Login failed' }
      };
    }
  }, []);

  const register = useCallback(async (email: string, password: string, name: string): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/register', { email, password, name });
      if (response.data.success) {
        const { user, token } = response.data.data;
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', token);
        }
        setUser(user);
      }
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: { message: error.response?.data?.error?.message || 'Registration failed' }
      };
    }
  }, []);

  const logout = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
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