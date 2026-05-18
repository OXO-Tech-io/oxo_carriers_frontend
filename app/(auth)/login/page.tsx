'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useAuthStore } from '@/store/authStore';
import { kcLogin } from '@/lib/keycloak';

/**
 * No local login form anymore — Keycloak owns the login UI. This page just
 * waits for keycloak-js to initialize; if the user is already signed in we
 * forward to `next`, otherwise we redirect to Keycloak's login page.
 */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialized = useAuthStore((s) => s.initialized);
  const accessToken = useAuthStore((s) => s.accessToken);

  const next = searchParams?.get('next') ?? '/';

  useEffect(() => {
    if (!initialized) return;
    if (accessToken) {
      router.replace(next);
      return;
    }
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const cleanNext = next.startsWith('/') ? next : `/${next}`;
      kcLogin(`${origin}${cleanNext}`);
    }
  }, [initialized, accessToken, next, router]);

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
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Redirecting to sign in…</p>
        </div>
        <p className="mt-8 text-xs text-gray-500">
          © 2026 OXO International FZE. All rights reserved.
        </p>
      </div>
    </div>
  );
}
