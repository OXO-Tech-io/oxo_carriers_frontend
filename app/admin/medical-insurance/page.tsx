'use client';

import { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { API_FILE_BASE_URL as API_BASE } from '@/lib/constants';
import { Badge, Button, Card, ConfirmationDialog, EmptyState, type BadgeVariant } from '@/components/ui';
import {
  UserIcon,
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

const STATUS_VARIANT: Record<ClaimStatus, BadgeVariant> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'gray',
};

const PAYMENT_STATUS_VARIANT: Record<PaymentStatus, BadgeVariant> = {
  not_paid: 'gray',
  partially_paid: 'warning',
  paid: 'success',
};

const getPaymentStatusLabel = (status: PaymentStatus) =>
  PAYMENT_STATUS_OPTIONS.find((o) => o.value === status)?.label || status;

const selectClass =
  'block w-full px-3 py-2 border border-[var(--gray-100)] rounded-lg text-sm bg-[var(--card-bg)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]';
const inputClass = selectClass;
const labelClass = 'block text-xs font-semibold text-[var(--gray-400)] mb-1';

export default function AdminMedicalInsurancePage() {
  const { isHR, isFinance, isSuperAdmin } = useAuth();
  const canAccess = isHR || isFinance || isSuperAdmin;
  const [claims, setClaims] = useState<MedicalClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState<ClaimStatus | ''>('');
  const [filterType, setFilterType] = useState<ClaimType | ''>('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isRejectFormOpen, setIsRejectFormOpen] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [approving, setApproving] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
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

  // Falls back to the first claim whenever the selected one isn't in the
  // current list - e.g. right after changing filters, or after a decision/
  // payment mutation refetches and the acted-on claim drops off the list.
  const selected = claims.find((c) => c.id === selectedId) ?? claims[0] ?? null;

  const selectClaim = (id: number) => {
    setSelectedId(id);
    setIsRejectFormOpen(false);
    setRejectComment('');
    setIsPaymentFormOpen(false);
    setError('');
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
      setIsRejectFormOpen(false);
      setRejectComment('');
      fetchClaims();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject');
    }
  };

  const openPaymentForm = (claim: MedicalClaim) => {
    setError('');
    setPaymentForm({
      payment_status: claim.payment_status === 'not_paid' ? 'paid' : claim.payment_status,
      paid_amount: claim.paid_amount != null ? String(claim.paid_amount) : '',
      payment_date: claim.payment_date ? claim.payment_date.slice(0, 10) : '',
      payment_reference: claim.payment_reference || '',
    });
    setIsPaymentFormOpen(true);
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
      setIsPaymentFormOpen(false);
      fetchClaims();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save payment details');
    } finally {
      setSavingPayment(false);
    }
  };

  if (!canAccess) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Medical Insurance Claims</h1>
        <EmptyState icon={FileText} title="You don't have permission to access this page." />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">Medical Insurance Claims</h1>
        <p className="text-sm text-[var(--gray-400)] font-medium mt-1">
          Verify documents, approve or reject claims, and process payments for approved claims.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border-l-4 border-red-500 text-red-600 dark:text-red-400 p-4 rounded-xl text-xs font-semibold animate-fade-in">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border-l-4 border-emerald-500 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl text-xs font-semibold animate-fade-in">
          {success}
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <div>
          <label className={labelClass}>Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ClaimStatus | '')}
            className={`${selectClass} min-w-[140px]`}
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Type</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ClaimType | '')}
            className={`${selectClass} min-w-[120px]`}
          >
            <option value="">All</option>
            <option value="IN">IN</option>
            <option value="OPD">OPD</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center min-h-64 items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--primary)] border-t-transparent" />
        </div>
      ) : claims.length === 0 ? (
        <EmptyState icon={FileText} title="No medical insurance claims found" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
          {/* Compact, scannable list instead of one full card per claim - click a
              row to review and act on it in the detail panel alongside. */}
          <div
            data-testid="claim-list"
            className="space-y-1.5 rounded-2xl border border-[var(--gray-100)] bg-[var(--card-bg)] p-2 lg:max-h-[calc(100vh-26rem)] lg:overflow-y-auto"
          >
            {claims.map((claim) => {
              const isSelected = selected?.id === claim.id;
              return (
                <button
                  key={claim.id}
                  onClick={() => selectClaim(claim.id)}
                  className={`w-full flex items-start gap-3 text-left p-3 rounded-xl transition-colors cursor-pointer ${
                    isSelected ? 'bg-[var(--primary-light)]' : 'hover:bg-[var(--gray-25)]'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      isSelected ? 'bg-[var(--primary)] text-white' : 'bg-[var(--primary-light)] text-[var(--primary)]'
                    }`}
                  >
                    <UserIcon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[var(--foreground)] truncate">
                      {claim.user?.first_name} {claim.user?.last_name}
                    </p>
                    <p className="text-[11px] text-[var(--gray-400)] font-semibold truncate mt-0.5">
                      {claim.type} · {claim.quarter} · {Number(claim.amount).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANT[claim.status]}>{claim.status}</Badge>
                </button>
              );
            })}
          </div>

          <div data-testid="claim-detail">
            {selected && (
              <Card>
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] shrink-0">
                        <UserIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[var(--foreground)]">
                          {selected.user?.first_name} {selected.user?.last_name}
                        </h3>
                        <p className="text-xs text-[var(--gray-400)] mt-0.5 font-medium">
                          {selected.user?.email} · {selected.user?.employee_id}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3.5 bg-[var(--gray-25)] border border-[var(--gray-100)] rounded-xl">
                      <div>
                        <p className="text-[10px] text-[var(--gray-400)] font-bold uppercase tracking-wider mb-0.5">Type</p>
                        <p className="text-xs font-bold text-[var(--foreground)]">{selected.type}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[var(--gray-400)] font-bold uppercase tracking-wider mb-0.5">Quarter</p>
                        <p className="text-xs font-bold text-[var(--foreground)]">{selected.quarter}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[var(--gray-400)] font-bold uppercase tracking-wider mb-0.5">Amount</p>
                        <p className="text-xs font-extrabold text-[var(--primary)]">{Number(selected.amount).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[var(--gray-400)] font-bold uppercase tracking-wider mb-0.5">Status</p>
                        <Badge variant={STATUS_VARIANT[selected.status]}>{selected.status}</Badge>
                      </div>
                    </div>

                    {selected.status === 'approved' && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-[var(--gray-400)] font-bold uppercase tracking-wider">Payment</span>
                        <Badge variant={PAYMENT_STATUS_VARIANT[selected.payment_status]}>
                          {getPaymentStatusLabel(selected.payment_status)}
                        </Badge>
                      </div>
                    )}

                    {selected.status === 'approved' && selected.payment_status !== 'not_paid' && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-[var(--gray-25)] border border-[var(--gray-100)] rounded-xl">
                        <div>
                          <p className="text-[10px] text-[var(--gray-400)] font-bold uppercase tracking-wider mb-0.5">Amount Paid</p>
                          <p className="text-xs font-bold text-[var(--foreground)]">
                            {selected.paid_amount != null ? Number(selected.paid_amount).toLocaleString() : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[var(--gray-400)] font-bold uppercase tracking-wider mb-0.5">Payment Date</p>
                          <p className="text-xs font-bold text-[var(--foreground)]">{selected.payment_date || '-'}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] text-[var(--gray-400)] font-bold uppercase tracking-wider mb-0.5">Reference</p>
                          <p className="text-xs font-bold text-[var(--foreground)]">{selected.payment_reference || '-'}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-4 text-xs">
                      <a
                        href={`${API_BASE}${selected.supportive_document_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-bold text-[var(--primary)] hover:underline"
                      >
                        <DocumentArrowUpIcon className="h-4 w-4" /> Supportive document
                      </a>
                      {selected.relevant_document_url && (
                        <a
                          href={`${API_BASE}${selected.relevant_document_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-bold text-[var(--primary)] hover:underline"
                        >
                          <DocumentArrowUpIcon className="h-4 w-4" /> Relevant document
                        </a>
                      )}
                    </div>

                    {selected.resubmission_of && (
                      <p className="text-xs font-semibold text-[var(--gray-400)]">Resubmission of claim #{selected.resubmission_of}</p>
                    )}

                    {/* OCD-491: rejection comment was captured but never shown to HR/Finance/Admin after the fact. */}
                    {selected.status === 'rejected' && selected.admin_comment && (
                      <div className="text-xs">
                        <span className="font-bold text-[var(--error-text)] uppercase tracking-wider block mb-1">Rejection Reason</span>
                        <p className="text-[var(--error-text)] bg-[var(--error-light)] p-3 rounded-xl leading-relaxed">
                          {selected.admin_comment}
                        </p>
                      </div>
                    )}

                    {isRejectFormOpen && (
                      <div className="p-4 bg-[var(--warning-light)] border border-[var(--warning-text)]/30 rounded-xl">
                        <label className="block text-xs font-bold text-[var(--warning-text)] mb-2">Rejection comment (required)</label>
                        <textarea
                          value={rejectComment}
                          onChange={(e) => setRejectComment(e.target.value)}
                          rows={3}
                          placeholder="Explain what the employee should fix..."
                          className={inputClass}
                        />
                        <div className="flex gap-2 mt-3">
                          <Button variant="danger" size="sm" disabled={!rejectComment.trim()} onClick={() => handleReject(selected.id)}>
                            Reject
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsRejectFormOpen(false);
                              setRejectComment('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {isPaymentFormOpen && (
                      <div className="p-4 bg-[var(--primary-light)] border border-[var(--primary)]/20 rounded-xl">
                        <p className="text-sm font-bold text-[var(--foreground)] mb-3">Record payment</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className={labelClass}>Payment Status</label>
                            <select
                              value={paymentForm.payment_status}
                              onChange={(e) => setPaymentForm((f) => ({ ...f, payment_status: e.target.value as PaymentStatus }))}
                              className={selectClass}
                            >
                              {PAYMENT_STATUS_OPTIONS.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className={labelClass}>
                              Amount Paid{paymentForm.payment_status !== 'not_paid' ? ' *' : ''}
                            </label>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={paymentForm.paid_amount}
                              onChange={(e) => setPaymentForm((f) => ({ ...f, paid_amount: e.target.value }))}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>
                              Payment Date{paymentForm.payment_status !== 'not_paid' ? ' *' : ''}
                            </label>
                            <input
                              type="date"
                              value={paymentForm.payment_date}
                              onChange={(e) => setPaymentForm((f) => ({ ...f, payment_date: e.target.value }))}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className={labelClass}>Reference / Notes</label>
                            <input
                              type="text"
                              value={paymentForm.payment_reference}
                              onChange={(e) => setPaymentForm((f) => ({ ...f, payment_reference: e.target.value }))}
                              placeholder="Bank ref, cheque no, notes..."
                              className={inputClass}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button size="sm" isLoading={savingPayment} onClick={() => handleRecordPayment(selected.id)}>
                            Save Payment
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setIsPaymentFormOpen(false)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {selected.status === 'pending' && !isRejectFormOpen && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button size="sm" onClick={() => setApprovingId(selected.id)}>
                        Approve
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => setIsRejectFormOpen(true)}>
                        Reject
                      </Button>
                    </div>
                  )}
                  {selected.status === 'approved' && !isPaymentFormOpen && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <Button size="sm" leftIcon={<BanknotesIcon className="h-4 w-4" />} onClick={() => openPaymentForm(selected)}>
                        {selected.payment_status === 'not_paid' ? 'Record Payment' : 'Update Payment'}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
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
