'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { useEffect, type ReactNode } from 'react';
import { ToastProvider } from '@/contexts/ToastContext';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

/**
 * Hydrates the user profile from /auth/me whenever an access token appears.
 * Triggered on initial mount (rehydrated session) and after fresh logins.
 */
function AuthHydrator({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore(s => s.accessToken);
  const setUser = useAuthStore(s => s.setUser);

  useEffect(() => {
    if (!accessToken) {
      setUser(null);
      return;
    }
    let active = true;
    api
      .get('/auth/me')
      .then(res => {
        if (active) setUser(res.data?.data ?? null);
      })
      .catch(err => {
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
        <AuthHydrator>{children}</AuthHydrator>
      </ToastProvider>
    </QueryClientProvider>
  );
}
