'use client';

import { create } from 'zustand';
import type { User } from '@/types';
import {
  ensureFreshToken,
  loginRedirect,
  logoutRedirect,
} from '@/lib/keycloakAuth';
import { getKeycloak } from '@/lib/keycloak';

/**
 * Auth state mirrored from the singleton keycloak-js instance. `keycloak-js`
 * holds the canonical tokens; this store exists so React components can
 * subscribe to changes and re-render. Sync happens via `syncFromKeycloak()`,
 * which the providers call after init and on every token refresh.
 *
 * No localStorage persistence — keycloak-js manages its own session via the
 * SSO iframe cookie + silent check on page load.
 */
interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  /** epoch milliseconds when accessToken expires */
  expiresAt: number | null;
  user: User | null;
  /** Set true after the initial keycloak-js init() has settled. */
  initialized: boolean;
  /** Trigger redirect to Keycloak's login page. */
  login: () => Promise<void>;
  /** Trigger redirect to Keycloak's end-session endpoint. */
  logout: () => Promise<void>;
  /** Refresh the access token if expiring; return the current valid token. */
  refresh: () => Promise<string | null>;
  /** Internal: pull tokens from keycloak-js after init/refresh/logout. */
  syncFromKeycloak: () => void;
  /** Internal: mark init complete (called once by providers). */
  setInitialized: (v: boolean) => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  user: null,
  initialized: false,

  login: async () => {
    await loginRedirect();
  },

  logout: async () => {
    set({ user: null });
    await logoutRedirect();
  },

  refresh: async () => {
    const token = await ensureFreshToken();
    syncFromKeycloakInternal(set);
    return token;
  },

  syncFromKeycloak: () => syncFromKeycloakInternal(set),

  setInitialized: (v) => set({ initialized: v }),

  setUser: (user) => set({ user }),
}));

const syncFromKeycloakInternal = (
  set: (partial: Partial<AuthState>) => void,
): void => {
  const kc = getKeycloak();
  if (!kc || !kc.authenticated) {
    set({
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
    });
    return;
  }
  // tokenParsed.exp is in seconds since epoch.
  const expSec = kc.tokenParsed?.exp;
  set({
    accessToken: kc.token ?? null,
    refreshToken: kc.refreshToken ?? null,
    expiresAt: typeof expSec === 'number' ? expSec * 1000 : null,
  });
};
