'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import api from '@/lib/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      mustChangePassword: false,

      login: async (email: string, password: string) => {
        try {
          const response = await api.post('/auth/login', { email, password });
          const { token, user, mustChangePassword } = response.data;
          
          set({
            token,
            user,
            isAuthenticated: true,
            mustChangePassword: mustChangePassword || false,
          });

          // Set token in localStorage for API interceptor
          localStorage.setItem('token', token);
        } catch (error: any) {
          throw new Error(error.response?.data?.message || 'Login failed');
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          mustChangePassword: false,
        });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      },

      setUser: (user: User) => {
        set({ user });
      },

      setToken: (token: string) => {
        set({ token, isAuthenticated: true });
        localStorage.setItem('token', token);
      },

      checkAuth: async () => {
        try {
          const token = get().token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
          if (!token) {
            set({ isAuthenticated: false, user: null });
            return;
          }

          const response = await api.get('/auth/me');
          const userData = response.data.user || (response.data.success ? response.data.user : null);
          if (userData) {
            set({
              user: userData,
              isAuthenticated: true,
              token,
            });
          } else {
            throw new Error('No user data received');
          }
        } catch (error: any) {
          console.error('Auth check failed:', error.message || error);
          set({ isAuthenticated: false, user: null, token: null });
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state: AuthState) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        mustChangePassword: state.mustChangePassword,
      }),
    }
  )
);
