'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword,
      });

      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
        <p className="font-medium">Invalid Link</p>
        <p className="text-sm mt-1">
          This password reset link is invalid or has expired. Please request a new one.
        </p>
        <div className="mt-4">
          <Link href="/login" className="text-red-700 font-semibold hover:underline">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
        <p className="text-gray-600 mt-2">Enter your new password below</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 p-4 rounded-lg">
            <p className="text-sm font-medium">{success}</p>
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label htmlFor="new-password" className="block text-sm font-semibold text-gray-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                id="new-password"
                name="new-password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter new password"
              />
            </div>
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-semibold text-gray-700 mb-2">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Confirm new password"
              />
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading || !!success}
            className="group relative w-full flex justify-center items-center py-3.5 px-4 border border-transparent text-base font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Resetting...
              </>
            ) : (
              'Set New Password'
            )}
          </button>
        </div>
        
        <div className="text-center">
          <Link href="/login" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
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
          <ResetPasswordForm />
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
