'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await api.get('/auth/me');
          if (response.data.success) {
            setUser(response.data.data.user);
          } else {
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [hydrated]);

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/login', { email, password });
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
  };

  const register = async (email: string, password: string, name: string): Promise<AuthResponse> => {
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
  };

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
    setUser(null);
  };

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