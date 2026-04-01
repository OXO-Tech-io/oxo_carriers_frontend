'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import {
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

export default function TestEmailPage() {
  const { isHR } = useAuth();
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('🧪 Test Email from HRIS System');
  const [message, setMessage] = useState('This is a test email to verify SMTP configuration is working correctly.');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  
  // Custom Config State
  const [useCustomConfig, setUseCustomConfig] = useState(false);
  const [customHost, setCustomHost] = useState('');
  const [customPort, setCustomPort] = useState('465');
  const [customUser, setCustomUser] = useState('');
  const [customPass, setCustomPass] = useState('');

  const checkEmailConfig = async () => {
    setLoadingConfig(true);
    try {
      const response = await api.get('/email-config-check');
      setConfigStatus(response.data);
    } catch (error: any) {
      setConfigStatus({
        success: false,
        message: 'Failed to check email configuration',
        error: error.message
      });
    } finally {
      setLoadingConfig(false);
    }
  };

  const sendTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const payload: any = {
        email: email || undefined,
        subject,
        message
      };

      if (useCustomConfig) {
        payload.customConfig = {
          host: customHost,
          port: customPort,
          user: customUser,
          pass: customPass
        };
      }

      const response = await api.post('/test-email', payload);

      setResult({
        success: response.data.success,
        message: response.data.message,
        details: response.data
      });
    } catch (error: any) {
      setResult({
        success: false,
        message: error.response?.data?.message || error.message || 'Failed to send test email',
        details: error.response?.data
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isHR) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <p className="text-lg font-semibold text-[#101828]">Access Denied</p>
          <p className="text-[#475467]">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#101828]">Email Testing</h1>
          <p className="mt-2 text-[#475467]">Test SMTP email configuration and send test emails</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Email Configuration Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#101828]">Current Server Config</h2>
              <button
                onClick={checkEmailConfig}
                disabled={loadingConfig}
                className="px-4 py-2 text-sm font-semibold text-[#465FFF] bg-[#ECF3FF] rounded-lg hover:bg-[#D6E4FF] transition-colors disabled:opacity-50"
              >
                {loadingConfig ? 'Checking...' : 'Check Now'}
              </button>
            </div>

            {configStatus ? (
              <div className={`p-4 rounded-lg ${
                configStatus.success 
                  ? 'bg-emerald-50 border border-emerald-200' 
                  : 'bg-amber-50 border border-amber-200'
              }`}>
                <div className="flex items-start space-x-3">
                  {configStatus.success ? (
                    <CheckCircleIcon className="h-6 w-6 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircleIcon className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-semibold ${
                      configStatus.success ? 'text-emerald-800' : 'text-amber-800'
                    }`}>
                      {configStatus.message}
                    </p>
                    {configStatus.config && (
                      <div className="mt-3 space-y-2 text-sm">
                        <div className="space-y-1">
                          <p className="flex justify-between">
                            <span className="text-[#475467]">Host:</span>
                            <span className="font-medium text-[#101828]">{configStatus.config.smtpHost}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-[#475467]">Port:</span>
                            <span className="font-medium text-[#101828]">{configStatus.config.smtpPort}</span>
                          </p>
                          <p className="flex justify-between">
                            <span className="text-[#475467]">User:</span>
                            <span className="font-medium text-[#101828]">{configStatus.config.smtpUser}</span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <InformationCircleIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Click Check Now to see current server configuration</p>
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm text-blue-800">
                  <p className="font-semibold mb-1">How it works</p>
                  <p>Check the configured settings on the server. If these are incorrect, update them in cPanel Node.js Selector environment variables.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Custom SMTP Form */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#101828]">Test New Settings</h2>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="useCustom"
                  checked={useCustomConfig}
                  onChange={(e) => setUseCustomConfig(e.target.checked)}
                  className="h-4 w-4 text-[#465FFF] focus:ring-[#465FFF] border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="useCustom" className="ml-2 text-sm font-medium text-[#344054] cursor-pointer">
                  Override Server Config
                </label>
              </div>
            </div>

            <form onSubmit={sendTestEmail} className="space-y-4">
              {useCustomConfig && (
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold text-[#475467] uppercase mb-1">SMTP Host</label>
                    <input
                      type="text"
                      value={customHost}
                      onChange={(e) => setCustomHost(e.target.value)}
                      placeholder="mail.example.com"
                      className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm"
                      required={useCustomConfig}
                    />
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-xs font-bold text-[#475467] uppercase mb-1">Port</label>
                    <input
                      type="text"
                      value={customPort}
                      onChange={(e) => setCustomPort(e.target.value)}
                      placeholder="465"
                      className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm"
                      required={useCustomConfig}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-[#475467] uppercase mb-1">SMTP User / Email</label>
                    <input
                      type="text"
                      value={customUser}
                      onChange={(e) => setCustomUser(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm"
                      required={useCustomConfig}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-[#475467] uppercase mb-1">SMTP Password</label>
                    <input
                      type="password"
                      value={customPass}
                      onChange={(e) => setCustomPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm"
                      required={useCustomConfig}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#344054] mb-1">Recipient Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Where to send the test email?"
                  className="w-full px-4 py-2.5 border border-[#D0D5DD] rounded-lg text-sm focus:ring-2 focus:ring-[#465FFF]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center space-x-2 px-6 py-3 bg-[#465FFF] text-white rounded-xl font-semibold hover:bg-[#3641F5] transition-all shadow-sm disabled:opacity-50"
              >
                <EnvelopeIcon className="h-5 w-5" />
                <span>{loading ? 'Processing...' : 'Send Test Mail'}</span>
              </button>
            </form>

            {/* Success/Error Result */}
            {result && (
              <div className={`mt-6 p-4 rounded-xl border animate-in zoom-in-95 duration-200 ${
                result.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start space-x-3">
                  {result.success ? (
                    <CheckCircleIcon className="h-6 w-6 text-emerald-600 mt-0.5" />
                  ) : (
                    <XCircleIcon className="h-6 w-6 text-red-600 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-bold ${result.success ? 'text-emerald-800' : 'text-red-800'}`}>
                      {result.success ? 'Connection Working!' : 'Connection Failed'}
                    </p>
                    <p className={`text-sm mt-1 ${result.success ? 'text-emerald-700' : 'text-red-700'}`}>
                      {result.message}
                    </p>
                    {!result.success && result.details?.code && (
                      <div className="mt-2 text-xs font-mono bg-white p-2 rounded border border-red-100 uppercase opacity-75">
                         Error Code: {result.details.code}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
