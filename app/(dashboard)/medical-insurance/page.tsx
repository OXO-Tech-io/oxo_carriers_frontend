'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  DocumentTextIcon,
  PlusIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentArrowUpIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

type ClaimType = 'IN' | 'OPD';
type ClaimStatus = 'pending' | 'approved' | 'rejected';

interface MedicalClaim {
  id: number;
  type: ClaimType;
  quarter: string;
  amount: number;
  status: ClaimStatus;
  supportive_document_url: string;
  relevant_document_url?: string | null;
  admin_comment?: string | null;
  resubmission_of?: number | null;
  created_at: string;
}

interface Limits {
  IN: { maxPerClaim: number };
  OPD: { maxPerQuarter: number; yearlyTotal: number };
}
const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';

export default function MedicalInsurancePage() {
  const [activeTab, setActiveTab] = useState<'apply' | 'claims'>('claims');
  const [claims, setClaims] = useState<MedicalClaim[]>([]);
  const [limits, setLimits] = useState<{ limits: Limits; currentQuarter: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    type: '' as ClaimType | '',
    quarter: '',
    amount: '',
  });
  const [supportiveFile, setSupportiveFile] = useState<File | null>(null);
  const [relevantFile, setRelevantFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [resubmitClaimId, setResubmitClaimId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [claimsRes, limitsRes] = await Promise.all([
        api.get('/medical-insurance'),
        api.get('/medical-insurance/limits'),
      ]);
      setClaims(claimsRes.data.claims || []);
      setLimits(limitsRes.data);
      if (limitsRes.data?.currentQuarter && !formData.quarter) {
        setFormData((prev) => ({ ...prev, quarter: limitsRes.data.currentQuarter }));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const maxAmount = formData.type === 'IN' ? 300000 : formData.type === 'OPD' ? 6000 : 0;
  const isAmountValid = formData.amount ? parseFloat(formData.amount) <= maxAmount && parseFloat(formData.amount) > 0 : false;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resubmitClaimId) {
      if (!supportiveFile) {
        setError('Supportive document is required for resubmission');
        return;
      }
      if (!isAmountValid || !formData.quarter) {
        setError('Please correct type, quarter, and amount.');
        return;
      }
      setError('');
      setSubmitting(true);
      try {
        const fd = new FormData();
        fd.append('type', formData.type);
        fd.append('quarter', formData.quarter);
        fd.append('amount', formData.amount);
        fd.append('supportive_document', supportiveFile);
        if (relevantFile) fd.append('relevant_document', relevantFile);
        await api.post(`/medical-insurance/${resubmitClaimId}/resubmit`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSuccess('Claim resubmitted successfully.');
        setResubmitClaimId(null);
        setFormData({ type: '', quarter: limits?.currentQuarter ?? '', amount: '' });
        setSupportiveFile(null);
        setRelevantFile(null);
        fetchData();
        setActiveTab('claims');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to resubmit');
      } finally {
        setSubmitting(false);
      }
    } else {
      setError('');
      setSuccess('');
      setSubmitting(true);
      try {
        const fd = new FormData();
        fd.append('type', formData.type);
        fd.append('quarter', formData.quarter || (limits?.currentQuarter ?? ''));
        fd.append('amount', formData.amount);
        if (supportiveFile) fd.append('supportive_document', supportiveFile);
        if (relevantFile) fd.append('relevant_document', relevantFile);
        await api.post('/medical-insurance', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSuccess('Medical insurance claim submitted. Status: Pending.');
        setFormData({ type: '', quarter: limits?.currentQuarter ?? '', amount: '' });
        setSupportiveFile(null);
        setRelevantFile(null);
        fetchData();
        setActiveTab('claims');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to submit claim');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const getStatusBadge = (status: ClaimStatus) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return styles[status] || styles.pending;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#101828]">Medical Insurance</h1>
          <p className="mt-2 text-[#475467]">Apply for IN / OPD claims and track your submissions</p>
        </div>
        <button
          onClick={() => setActiveTab('apply')}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#465FFF] text-white rounded-xl font-semibold hover:bg-[#3641F5] transition-colors shadow-sm"
        >
          <PlusIcon className="h-5 w-5" />
          <span>New Claim</span>
        </button>
      </div>

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

      <div className="border-b border-[#E4E7EC]">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('claims')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'claims'
                ? 'border-[#465FFF] text-[#465FFF]'
                : 'border-transparent text-[#475467] hover:text-[#344054] hover:border-[#D0D5DD]'
            }`}
          >
            My Claims
          </button>
          <button
            onClick={() => setActiveTab('apply')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'apply'
                ? 'border-[#465FFF] text-[#465FFF]'
                : 'border-transparent text-[#475467] hover:text-[#344054] hover:border-[#D0D5DD]'
            }`}
          >
            Apply
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="flex justify-center min-h-64 items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#465FFF] border-t-transparent" />
        </div>
      ) : (
        <>
          {activeTab === 'apply' && (
            <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-6 lg:p-8">
              <h2 className="text-xl font-bold text-[#101828] mb-6">
                {resubmitClaimId ? 'Resubmit Medical Insurance Claim' : 'Submit Medical Insurance Claim'}
              </h2>
              {resubmitClaimId && (
                <p className="text-sm text-[#475467] mb-4">Edit the values below if needed and upload new documents.</p>
              )}
              {limits && (
                <div className="mb-6 p-4 bg-[#F0F9FF] border border-[#BAE6FD] rounded-lg text-sm text-[#0C4A6E]">
                  <p><strong>IN-patient:</strong> Up to 300,000 per claim.</p>
                  <p><strong>OPD (Out-patient):</strong> 6,000 per quarter (24,000 per year). Current quarter: {limits.currentQuarter}</p>
                </div>
              )}
              <form onSubmit={handleFormSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-[#344054] mb-2">Type *</label>
                    <select
                      required
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as ClaimType })}
                      className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm font-medium text-[#344054] bg-white focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                    >
                      <option value="">Select type</option>
                      <option value="IN">In-patient (IN)</option>
                      <option value="OPD">Out-patient (OPD)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#344054] mb-2">Quarter *</label>
                    <input
                      type="text"
                      readOnly={!resubmitClaimId}
                      value={formData.quarter || limits?.currentQuarter || ''}
                      onChange={resubmitClaimId ? (e) => setFormData({ ...formData, quarter: e.target.value }) : undefined}
                      className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#344054] bg-white focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                      style={!resubmitClaimId ? { backgroundColor: '#F9FAFB' } : undefined}
                    />
                    <p className="mt-1 text-xs text-[#667085]">{resubmitClaimId ? 'You can edit quarter if needed' : 'Derived from current date'}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#344054] mb-2">Amount *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={maxAmount || 300000}
                    step={0.01}
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                    placeholder={formData.type === 'OPD' ? 'Max 6,000 per quarter' : 'Max 300,000'}
                  />
                  {formData.type && (
                    <p className="mt-1 text-xs text-[#667085]">
                      Max: {maxAmount.toLocaleString()}{formData.type === 'OPD' ? ' per quarter' : ' per claim'}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#344054] mb-2">Supportive Document *</label>
                  <div className="flex items-center space-x-3">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => setSupportiveFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <div className="flex items-center space-x-2 px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#475467] hover:bg-[#F9FAFB]">
                        <DocumentArrowUpIcon className="h-5 w-5" />
                        <span>{supportiveFile ? supportiveFile.name : 'Choose file'}</span>
                      </div>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#344054] mb-2">Relevant Document (Optional)</label>
                  <div className="flex items-center space-x-3">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => setRelevantFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />
                      <div className="flex items-center space-x-2 px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#475467] hover:bg-[#F9FAFB]">
                        <DocumentArrowUpIcon className="h-5 w-5" />
                        <span>{relevantFile ? relevantFile.name : 'Choose file'}</span>
                      </div>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setResubmitClaimId(null);
                      setFormData({ type: '', quarter: limits?.currentQuarter ?? '', amount: '' });
                      setSupportiveFile(null);
                      setRelevantFile(null);
                    }}
                    className="px-4 py-2.5 text-sm font-semibold text-[#344054] bg-white border border-[#D0D5DD] rounded-lg hover:bg-[#F9FAFB]"
                  >
                    {resubmitClaimId ? 'Cancel' : 'Clear'}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !formData.type || !formData.amount || !supportiveFile || !isAmountValid || (resubmitClaimId ? !formData.quarter : false)}
                    className="px-4 py-2.5 text-sm font-semibold text-white bg-[#465FFF] rounded-lg hover:bg-[#3641F5] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : resubmitClaimId ? 'Resubmit' : 'Submit Claim'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'claims' && (
            <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#E4E7EC]">
                  <thead className="bg-[#F9FAFB]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase tracking-wider">Quarter</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase tracking-wider">Submitted</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#E4E7EC]">
                    {claims.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center">
                          <DocumentTextIcon className="h-12 w-12 text-[#98A2B3] mx-auto mb-4" />
                          <p className="text-sm font-medium text-[#344054]">No medical insurance claims yet</p>
                          <button
                            onClick={() => setActiveTab('apply')}
                            className="mt-2 text-sm font-medium text-[#465FFF] hover:text-[#3641F5]"
                          >
                            Submit a claim
                          </button>
                        </td>
                      </tr>
                    ) : (
                      claims.map((claim) => (
                        <tr key={claim.id} className="hover:bg-[#F9FAFB]">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#101828]">{claim.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#344054]">{claim.quarter}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#101828]">{Number(claim.amount).toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(claim.status)}`}>
                              {claim.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475467]">
                            {new Date(claim.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-2">
                              <a
                                href={`${API_BASE}${claim.supportive_document_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-sm text-[#465FFF] hover:text-[#3641F5]"
                              >
                                <DocumentArrowUpIcon className="h-4 w-4 mr-1" /> Supportive
                              </a>
                              {claim.relevant_document_url && (
                                <a
                                  href={`${API_BASE}${claim.relevant_document_url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-sm text-[#465FFF] hover:text-[#3641F5]"
                                >
                                  <DocumentArrowUpIcon className="h-4 w-4 mr-1" /> Relevant
                                </a>
                              )}
                              {claim.status === 'rejected' && (
                                <>
                                  {claim.admin_comment && (
                                    <p className="text-xs text-red-600 mt-1">Admin: {claim.admin_comment}</p>
                                  )}
                                  {!claims.some((other) => other.resubmission_of === claim.id) && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setResubmitClaimId(claim.id);
                                        setFormData({
                                          type: claim.type,
                                          quarter: claim.quarter,
                                          amount: String(claim.amount),
                                        });
                                        setSupportiveFile(null);
                                        setRelevantFile(null);
                                        setActiveTab('apply');
                                      }}
                                      className="inline-flex items-center mt-1 text-sm font-medium text-[#465FFF] hover:text-[#3641F5]"
                                    >
                                      <ArrowPathIcon className="h-4 w-4 mr-1" /> Resubmit
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
