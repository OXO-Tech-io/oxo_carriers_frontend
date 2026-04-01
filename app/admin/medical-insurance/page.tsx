'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  DocumentTextIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline';

type ClaimType = 'IN' | 'OPD';
type ClaimStatus = 'pending' | 'approved' | 'rejected';

interface MedicalClaim {
  id: number;
  user_id: number;
  type: ClaimType;
  quarter: string;
  amount: number;
  status: ClaimStatus;
  supportive_document_url: string;
  relevant_document_url?: string | null;
  admin_comment?: string | null;
  resubmission_of?: number | null;
  created_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    employee_id: string;
  };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';

export default function AdminMedicalInsurancePage() {
  const [claims, setClaims] = useState<MedicalClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState<ClaimStatus | ''>('');
  const [filterType, setFilterType] = useState<ClaimType | ''>('');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectComment, setRejectComment] = useState('');

  useEffect(() => {
    fetchClaims();
  }, [filterStatus, filterType]);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterType) params.append('type', filterType);
      const qs = params.toString();
      const res = await api.get(`/medical-insurance${qs ? `?${qs}` : ''}`);
      setClaims(res.data.claims || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      setError('');
      await api.put(`/medical-insurance/${id}/approve`);
      setSuccess('Claim approved.');
      fetchClaims();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (id: number) => {
    if (!rejectComment.trim()) {
      setError('Comment is required when rejecting.');
      return;
    }
    try {
      setError('');
      await api.put(`/medical-insurance/${id}/reject`, { admin_comment: rejectComment.trim() });
      setSuccess('Claim rejected.');
      setRejectingId(null);
      setRejectComment('');
      fetchClaims();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject');
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
      <div>
        <h1 className="text-3xl font-bold text-[#101828]">Medical Insurance Claims</h1>
        <p className="mt-2 text-[#475467]">Verify documents and approve or reject claims</p>
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

      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs font-medium text-[#667085] mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ClaimStatus | '')}
            className="block w-full min-w-[120px] px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#667085] mb-1">Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ClaimType | '')}
            className="block w-full min-w-[120px] px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
          >
            <option value="">All</option>
            <option value="IN">IN</option>
            <option value="OPD">OPD</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center min-h-64 items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#465FFF] border-t-transparent" />
        </div>
      ) : claims.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-12 text-center">
          <DocumentTextIcon className="h-12 w-12 text-[#98A2B3] mx-auto mb-4" />
          <p className="text-sm font-medium text-[#344054]">No medical insurance claims found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((claim) => (
            <div
              key={claim.id}
              className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 rounded-lg bg-[#ECF3FF]">
                      <UserIcon className="h-5 w-5 text-[#465FFF]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#101828]">
                        {claim.user?.first_name} {claim.user?.last_name}
                      </p>
                      <p className="text-xs text-[#475467]">{claim.user?.email} · {claim.user?.employee_id}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-[#98A2B3] mb-1">Type</p>
                      <p className="text-sm font-semibold text-[#344054]">{claim.type}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#98A2B3] mb-1">Quarter</p>
                      <p className="text-sm font-semibold text-[#344054]">{claim.quarter}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#98A2B3] mb-1">Amount</p>
                      <p className="text-sm font-semibold text-[#344054]">{Number(claim.amount).toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#98A2B3] mb-1">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(claim.status)}`}>
                        {claim.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3 mb-2">
                    <a
                      href={`${API_BASE}${claim.supportive_document_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-[#465FFF] hover:text-[#3641F5]"
                    >
                      <DocumentArrowUpIcon className="h-4 w-4 mr-1" /> Supportive document
                    </a>
                    {claim.relevant_document_url && (
                      <a
                        href={`${API_BASE}${claim.relevant_document_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-[#465FFF] hover:text-[#3641F5]"
                      >
                        <DocumentArrowUpIcon className="h-4 w-4 mr-1" /> Relevant document
                      </a>
                    )}
                  </div>
                  {claim.resubmission_of && (
                    <p className="text-xs text-[#667085]">Resubmission of claim #{claim.resubmission_of}</p>
                  )}
                  {rejectingId === claim.id && (
                    <div className="mt-4 p-4 bg-[#FEF3C7] border border-[#FCD34D] rounded-lg">
                      <label className="block text-sm font-semibold text-[#92400E] mb-2">Rejection comment (required)</label>
                      <textarea
                        value={rejectComment}
                        onChange={(e) => setRejectComment(e.target.value)}
                        rows={3}
                        placeholder="Explain what the employee should fix..."
                        className="block w-full px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleReject(claim.id)}
                          disabled={!rejectComment.trim()}
                          className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            setRejectingId(null);
                            setRejectComment('');
                          }}
                          className="px-4 py-2 text-sm font-semibold text-[#344054] border border-[#D0D5DD] rounded-lg hover:bg-[#F9FAFB]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {claim.status === 'pending' && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(claim.id)}
                      className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-[#10B981] rounded-lg hover:bg-[#059669]"
                    >
                      <CheckCircleIcon className="h-5 w-5 mr-2" /> Approve
                    </button>
                    {rejectingId !== claim.id ? (
                      <button
                        onClick={() => setRejectingId(claim.id)}
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
                      >
                        <XCircleIcon className="h-5 w-5 mr-2" /> Reject
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
