'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState, type ReactNode } from 'react';
import { ToastProvider } from '@/contexts/ToastContext';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { initKeycloak } from '@/lib/keycloak';
import api from '@/lib/api';

/**
 * Initialize keycloak-js once on mount, then sync tokens into the auth store
 * after init and on every refresh. Until init resolves, render a loader so
 * downstream code never sees a half-bootstrapped auth state.
 */
function KeycloakBootstrap({ children }: { children: ReactNode }) {
  const initialized = useAuthStore((s) => s.initialized);
  const setInitialized = useAuthStore((s) => s.setInitialized);
  const syncFromKeycloak = useAuthStore((s) => s.syncFromKeycloak);

  useEffect(() => {
    if (initialized) return;
    let cancelled = false;
    initKeycloak({ onTokens: () => syncFromKeycloak() })
      .then(() => {
        if (cancelled) return;
        syncFromKeycloak();
        setInitialized(true);
      })
      .catch((err) => {
        console.error('[Keycloak] init failed:', err);
        if (!cancelled) setInitialized(true);
      });
    return () => {
      cancelled = true;
    };
  }, [initialized, setInitialized, syncFromKeycloak]);

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Hydrates the user profile from /auth/me whenever an access token appears.
 * Triggered after Keycloak init (if already signed in) or after a fresh login.
 */
function AuthHydrator({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    if (!accessToken) {
      setUser(null);
      return;
    }
    let active = true;
    api
      .get('/auth/me')
      .then((res) => {
        if (active) setUser(res.data?.data ?? null);
      })
      .catch((err) => {
        console.error('Failed to load /auth/me:', err);
        if (active) setUser(null);
      });
    return () => {
      active = false;
    };
  }, [accessToken, setUser]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <KeycloakBootstrap>
          <AuthHydrator>{children}</AuthHydrator>
        </KeycloakBootstrap>
      </ToastProvider>
    </QueryClientProvider>
  );
}

// Mount detection helper retained for callers that want to know if we are
// hydrated. Kept as a no-op state to avoid SSR re-renders.
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
