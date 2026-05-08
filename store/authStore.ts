'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';
import {
  endSession,
  passwordLogin,
  refreshTokens,
} from '@/lib/keycloakAuth';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  /** epoch milliseconds when accessToken expires */
  expiresAt: number | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<string | null>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      user: null,

      login: async (email, password) => {
        const tokens = await passwordLogin(email, password);
        set({
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: Date.now() + tokens.expires_in * 1000,
        });
      },

      logout: async () => {
        const rt = get().refreshToken;
        if (rt) await endSession(rt);
        set({
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          user: null,
        });
      },

      /**
       * Returns a still-valid access token, refreshing if necessary. Returns
       * null when there's no session to refresh from.
       */
      refresh: async () => {
        const { accessToken, refreshToken, expiresAt } = get();
        if (!refreshToken) return null;

        // 30 seconds of slack so the call doesn't race expiry
        const valid = expiresAt && expiresAt - 30_000 > Date.now();
        if (valid && accessToken) return accessToken;

        try {
          const tokens = await refreshTokens(refreshToken);
          set({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            expiresAt: Date.now() + tokens.expires_in * 1000,
          });
          return tokens.access_token;
        } catch {
          set({
            accessToken: null,
            refreshToken: null,
            expiresAt: null,
            user: null,
          });
          return null;
        }
      },

      setUser: user => set({ user }),
    }),
    {
      name: 'oxo-auth',
      partialize: state => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        user: state.user,
      }),
    }
  )
);
