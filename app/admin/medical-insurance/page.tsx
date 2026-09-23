'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { API_FILE_BASE_URL as API_BASE } from '@/lib/constants';
import { ConfirmationDialog } from '@/components/ui';
import {
  DocumentTextIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentArrowUpIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';

type ClaimType = 'IN' | 'OPD';
type ClaimStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
type PaymentStatus = 'not_paid' | 'partially_paid' | 'paid';

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
  payment_status: PaymentStatus;
  paid_amount?: number | null;
  payment_date?: string | null;
  payment_reference?: string | null;
  created_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    employee_id: string;
  };
}

const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: 'not_paid', label: 'Not Paid' },
  { value: 'partially_paid', label: 'Partly Paid' },
  { value: 'paid', label: 'Paid' },
];

const getPaymentStatusBadge = (status: PaymentStatus) => {
  const styles: Record<PaymentStatus, string> = {
    not_paid: 'bg-gray-100 text-gray-600',
    partially_paid: 'bg-amber-100 text-amber-700',
    paid: 'bg-emerald-100 text-emerald-700',
  };
  return styles[status] || styles.not_paid;
};

const getPaymentStatusLabel = (status: PaymentStatus) =>
  PAYMENT_STATUS_OPTIONS.find((o) => o.value === status)?.label || status;

export default function AdminMedicalInsurancePage() {
  const { isHR, isFinance, isSuperAdmin } = useAuth();
  const canAccess = isHR || isFinance || isSuperAdmin;
  const [claims, setClaims] = useState<MedicalClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState<ClaimStatus | ''>('');
  const [filterType, setFilterType] = useState<ClaimType | ''>('');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [approving, setApproving] = useState(false);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [paymentForm, setPaymentForm] = useState<{
    payment_status: PaymentStatus;
    paid_amount: string;
    payment_date: string;
    payment_reference: string;
  }>({ payment_status: 'paid', paid_amount: '', payment_date: '', payment_reference: '' });
  const [savingPayment, setSavingPayment] = useState(false);

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
      const res = await api.get(`/medical-insurance-claims${qs ? `?${qs}` : ''}`);
      setClaims(res.data.claims || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load claims');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      setApproving(true);
      setError('');
      await api.put(`/medical-insurance-claims/${id}/decisions`, { action: 'approve' });
      setSuccess('Claim approved.');
      setApprovingId(null);
      fetchClaims();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve');
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async (id: number) => {
    if (!rejectComment.trim()) {
      setError('Comment is required when rejecting.');
      return;
    }
    try {
      setError('');
      await api.put(`/medical-insurance-claims/${id}/decisions`, { action: 'reject', admin_comment: rejectComment.trim() });
      setSuccess('Claim rejected.');
      setRejectingId(null);
      setRejectComment('');
      fetchClaims();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject');
    }
  };

  const openPaymentForm = (claim: MedicalClaim) => {
    setError('');
    setPayingId(claim.id);
    setPaymentForm({
      payment_status: claim.payment_status === 'not_paid' ? 'paid' : claim.payment_status,
      paid_amount: claim.paid_amount != null ? String(claim.paid_amount) : '',
      payment_date: claim.payment_date ? claim.payment_date.slice(0, 10) : '',
      payment_reference: claim.payment_reference || '',
    });
  };

  const handleRecordPayment = async (id: number) => {
    try {
      setSavingPayment(true);
      setError('');
      await api.put(`/medical-insurance-claims/${id}/payments`, {
        payment_status: paymentForm.payment_status,
        paid_amount: paymentForm.paid_amount || undefined,
        payment_date: paymentForm.payment_date || undefined,
        payment_reference: paymentForm.payment_reference || undefined,
      });
      setSuccess('Payment details saved.');
      setPayingId(null);
      fetchClaims();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save payment details');
    } finally {
      setSavingPayment(false);
    }
  };

  const getStatusBadge = (status: ClaimStatus) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-600',
    };
    return styles[status] || styles.pending;
  };

  if (!canAccess) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[#101828]">Medical Insurance Claims</h1>
        <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-12 text-center">
          <p className="text-sm text-[#475467]">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-[#101828]">Medical Insurance Claims</h1>
        <p className="mt-2 text-[#475467]">Verify documents, approve or reject claims, and process payments for approved claims</p>
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
            <option value="cancelled">Cancelled</option>
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
                    {claim.status === 'approved' && (
                      <div>
                        <p className="text-xs text-[#98A2B3] mb-1">Payment</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getPaymentStatusBadge(claim.payment_status)}`}>
                          {getPaymentStatusLabel(claim.payment_status)}
                        </span>
                      </div>
                    )}
                  </div>
                  {claim.status === 'approved' && claim.payment_status !== 'not_paid' && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-3 bg-[#F9FAFB] rounded-lg">
                      <div>
                        <p className="text-xs text-[#98A2B3] mb-1">Amount Paid</p>
                        <p className="text-sm font-semibold text-[#344054]">
                          {claim.paid_amount != null ? Number(claim.paid_amount).toLocaleString() : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[#98A2B3] mb-1">Payment Date</p>
                        <p className="text-sm font-semibold text-[#344054]">{claim.payment_date || '-'}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-xs text-[#98A2B3] mb-1">Reference</p>
                        <p className="text-sm font-semibold text-[#344054]">{claim.payment_reference || '-'}</p>
                      </div>
                    </div>
                  )}
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
                  {/* OCD-491: rejection comment was captured but never shown to HR/Finance/Admin after the fact. */}
                  {claim.status === 'rejected' && claim.admin_comment && (
                    <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-xs font-semibold text-red-700">Rejection reason: <span className="font-normal">{claim.admin_comment}</span></p>
                    </div>
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
                  {payingId === claim.id && (
                    <div className="mt-4 p-4 bg-[#ECF3FF] border border-[#B8CEFF] rounded-lg">
                      <p className="text-sm font-semibold text-[#101828] mb-3">Record payment</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-[#667085] mb-1">Payment Status</label>
                          <select
                            value={paymentForm.payment_status}
                            onChange={(e) => setPaymentForm((f) => ({ ...f, payment_status: e.target.value as PaymentStatus }))}
                            className="block w-full px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                          >
                            {PAYMENT_STATUS_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#667085] mb-1">
                            Amount Paid{paymentForm.payment_status !== 'not_paid' ? ' *' : ''}
                          </label>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={paymentForm.paid_amount}
                            onChange={(e) => setPaymentForm((f) => ({ ...f, paid_amount: e.target.value }))}
                            className="block w-full px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#667085] mb-1">
                            Payment Date{paymentForm.payment_status !== 'not_paid' ? ' *' : ''}
                          </label>
                          <input
                            type="date"
                            value={paymentForm.payment_date}
                            onChange={(e) => setPaymentForm((f) => ({ ...f, payment_date: e.target.value }))}
                            className="block w-full px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-[#667085] mb-1">Reference / Notes</label>
                          <input
                            type="text"
                            value={paymentForm.payment_reference}
                            onChange={(e) => setPaymentForm((f) => ({ ...f, payment_reference: e.target.value }))}
                            placeholder="Bank ref, cheque no, notes..."
                            className="block w-full px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleRecordPayment(claim.id)}
                          disabled={savingPayment}
                          className="px-4 py-2 text-sm font-semibold text-white bg-[#465FFF] rounded-lg hover:bg-[#3641F5] disabled:opacity-50"
                        >
                          {savingPayment ? 'Saving...' : 'Save Payment'}
                        </button>
                        <button
                          onClick={() => setPayingId(null)}
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
                      onClick={() => setApprovingId(claim.id)}
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
                {claim.status === 'approved' && payingId !== claim.id && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => openPaymentForm(claim)}
                      className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-[#465FFF] rounded-lg hover:bg-[#3641F5]"
                    >
                      <BanknotesIcon className="h-5 w-5 mr-2" />
                      {claim.payment_status === 'not_paid' ? 'Record Payment' : 'Update Payment'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* OCD-492: confirm before approving - it's an impactful, irreversible decision. */}
      <ConfirmationDialog
        isOpen={approvingId !== null}
        onClose={() => setApprovingId(null)}
        onConfirm={() => approvingId !== null && handleApprove(approvingId)}
        title="Approve Claim"
        message="Approve this medical insurance claim? This action cannot be undone."
        confirmLabel="Approve"
        isLoading={approving}
      />
    </div>
  );
}
