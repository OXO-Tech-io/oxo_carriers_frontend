'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setError('Invalid or missing verification token.');
      setLoading(false);
    }
  }, [token]);

  const verifyEmail = async () => {
    if (!token) return;

    setVerifying(true);
    setError('');
    setSuccess('');

    try {
      // Backend expects GET request with token as query parameter
      await api.get(`/auth/verify-email?token=${token}`);

      setSuccess('Email verified successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to verify email. The link may have expired.');
    } finally {
      setLoading(false);
      setVerifying(false);
    }
  };

  if (!token) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
        <p className="font-medium">Invalid Link</p>
        <p className="text-sm mt-1">
          This email verification link is invalid or has expired. Please request a new one.
        </p>
        <div className="mt-4">
          <Link href="/login" className="text-red-700 font-semibold hover:underline">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading || verifying) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <svg className="animate-spin h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Your Email</h2>
          <p className="text-gray-600">Please wait while we verify your email address...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
          <p className="font-medium mb-2">Verification Failed</p>
          <p className="text-sm">{error}</p>
          <div className="mt-4">
            <Link href="/login" className="text-red-700 font-semibold hover:underline">
              Return to Login
            </Link>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 p-4 rounded-lg">
          <p className="font-medium mb-2">Email Verified!</p>
          <p className="text-sm">{success}</p>
        </div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center">
            <Image
              src="/logo.png"
              alt="OXO International Logo"
              width={180}
              height={50}
              style={{ height: 'auto', width: 'auto', maxHeight: '70px' }}
              className="object-contain"
            />
          </div>
        </div>

        <Suspense fallback={
          <div className="flex items-center justify-center p-8 bg-white rounded-2xl shadow-xl">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        }>
          <VerifyEmailForm />
        </Suspense>
      </div>
      
      <div className="fixed bottom-4 text-center w-full">
          <p className="text-xs text-gray-500">
            © 2026 OXO International FZE. All rights reserved.
          </p>
      </div>
    </div>
  );
}
