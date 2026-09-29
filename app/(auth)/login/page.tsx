'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/store/authStore';
import { kcLogin, SESSION_TERMINATED_MESSAGE_KEY } from '@/lib/keycloak';

/**
 * No local login form anymore — Keycloak owns the login UI. This page just
 * waits for keycloak-js to initialize; if the user is already signed in we
 * forward to `next`, otherwise we redirect to Keycloak's login page.
 *
 * OCD-455: when the previous session was terminated by a login elsewhere,
 * lib/api.ts's response interceptor stashes an explanatory message before
 * redirecting here. If present, we show it and wait for the user to
 * acknowledge instead of auto-redirecting straight to Keycloak, so it isn't
 * swept away before they can read it.
 */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialized = useAuthStore((s) => s.initialized);
  const accessToken = useAuthStore((s) => s.accessToken);
  // Read (and consume) synchronously during the initial render, via a lazy
  // useState initializer - NOT a useEffect. The redirect effect below reads
  // this same state on that same first render/commit, before an effect-set
  // value would have taken effect, so a useEffect here would let the
  // redirect fire once before the message ever got a chance to block it.
  const [terminatedMessage] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const msg = sessionStorage.getItem(SESSION_TERMINATED_MESSAGE_KEY);
      if (msg) sessionStorage.removeItem(SESSION_TERMINATED_MESSAGE_KEY);
      return msg;
    } catch {
      return null;
    }
  });

  const next = searchParams?.get('next') ?? '/';

  const goToKeycloakLogin = useCallback(() => {
    if (typeof window === 'undefined') return;
    const origin = window.location.origin;
    const cleanNext = next.startsWith('/') ? next : `/${next}`;
    kcLogin(`${origin}${cleanNext}`);
  }, [next]);

  useEffect(() => {
    if (!initialized) return;
    if (accessToken) {
      router.replace(next);
      return;
    }
    if (terminatedMessage) return; // wait for the user to acknowledge first
    goToKeycloakLogin();
  }, [initialized, accessToken, next, router, terminatedMessage, goToKeycloakLogin]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center items-center mb-8">
          <Image
            src="/logo.png"
            alt="OXO International Logo"
            width={180}
            height={50}
            style={{ height: 'auto', width: 'auto', maxHeight: '70px' }}
            className="object-contain"
          />
        </div>
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {terminatedMessage ? (
            <>
              <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                </svg>
              </div>
              <p className="text-sm text-gray-700">{terminatedMessage}</p>
              <button
                type="button"
                onClick={goToKeycloakLogin}
                className="mt-6 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700"
              >
                Continue to sign in
              </button>
            </>
          ) : (
            <>
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
              <p className="mt-4 text-gray-600">Redirecting to sign in…</p>
            </>
          )}
        </div>
        <p className="mt-8 text-xs text-gray-500">
          © 2026 OXO International FZE. All rights reserved.
        </p>
      </div>
    </div>
  );
}
