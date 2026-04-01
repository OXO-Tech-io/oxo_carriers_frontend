'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import {
  BanknotesIcon,
  PlusIcon,
  ArrowUpTrayIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  DocumentArrowDownIcon,
} from '@heroicons/react/24/outline';
import { PaymentVoucher, VoucherStatus } from '@/types';
import CreateVoucherModal from '@/components/modals/CreateVoucherModal';
import ReviewVoucherModal from '@/components/modals/ReviewVoucherModal';

const STATUS_OPTIONS: { value: VoucherStatus | ''; label: string }[] = [
  { value: '', label: 'All' },
  { value: VoucherStatus.PENDING_REVIEW, label: 'Pending Review' },
  { value: VoucherStatus.APPROVED, label: 'Approved' },
  { value: VoucherStatus.REJECTED, label: 'Rejected' },
  { value: VoucherStatus.INFORMATION_REQUEST, label: 'Information Request' },
  { value: VoucherStatus.BANK_UPLOAD, label: 'Bank Upload' },
  { value: VoucherStatus.PAID, label: 'Paid' },
];

function statusBadge(status: VoucherStatus) {
  const map: Record<VoucherStatus, string> = {
    [VoucherStatus.PENDING_REVIEW]: 'bg-amber-100 text-amber-700',
    [VoucherStatus.APPROVED]: 'bg-emerald-100 text-emerald-700',
    [VoucherStatus.REJECTED]: 'bg-red-100 text-red-700',
    [VoucherStatus.INFORMATION_REQUEST]: 'bg-blue-100 text-blue-700',
    [VoucherStatus.BANK_UPLOAD]: 'bg-purple-100 text-purple-700',
    [VoucherStatus.PAID]: 'bg-slate-100 text-slate-700',
  };
  const labels: Record<VoucherStatus, string> = {
    [VoucherStatus.PENDING_REVIEW]: 'Pending Review',
    [VoucherStatus.APPROVED]: 'Approved',
    [VoucherStatus.REJECTED]: 'Rejected',
    [VoucherStatus.INFORMATION_REQUEST]: 'Information Request',
    [VoucherStatus.BANK_UPLOAD]: 'Bank Upload',
    [VoucherStatus.PAID]: 'Paid',
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${map[status] || ''}`}>
      {labels[status] || status}
    </span>
  );
}

export default function VouchersPage() {
  return (
    <Suspense fallback={<div className="flex justify-center min-h-64 items-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-[#465FFF] border-t-transparent" /></div>}>
      <VoucherPageContent />
    </Suspense>
  );
}
function VoucherPageContent() {
  const { isFinanceManager, isFinanceExecutive, isPaymentApprover } = useAuth();
  const [vouchers, setVouchers] = useState<PaymentVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState<VoucherStatus | ''>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<PaymentVoucher | null>(null);
  const [actioningId, setActioningId] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');
  
  const canAccess = isFinanceManager || isFinanceExecutive || isPaymentApprover;

  useEffect(() => {
    if (statusParam) {
      setFilterStatus(statusParam as VoucherStatus);
    } else {
      setFilterStatus('');
    }
  }, [statusParam]);

  useEffect(() => {
    if (canAccess) fetchVouchers();
  }, [canAccess, filterStatus]);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      const qs = params.toString();
      const res = await api.get(`/vouchers${qs ? `?${qs}` : ''}`);
      setVouchers(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setSuccess('Voucher created successfully.');
    fetchVouchers();
  };

  const handleReviewSuccess = () => {
    setSuccess('Review submitted.');
    setShowReviewModal(false);
    setSelectedVoucher(null);
    fetchVouchers();
  };

  const handleResubmit = async (id: number) => {
    setActioningId(id);
    setError('');
    try {
      await api.put(`/vouchers/${id}/resubmit`);
      setSuccess('Voucher resubmitted for review.');
      fetchVouchers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resubmit');
    } finally {
      setActioningId(null);
    }
  };

  const handleBankUpload = async (id: number) => {
    setActioningId(id);
    setError('');
    try {
      await api.put(`/vouchers/${id}/bank-upload`);
      setSuccess('Marked as Bank Upload.');
      fetchVouchers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to mark bank upload');
    } finally {
      setActioningId(null);
    }
  };

  const handleMarkPaid = async (id: number) => {
    setActioningId(id);
    setError('');
    try {
      await api.put(`/vouchers/${id}/paid`);
      setSuccess('Voucher marked as Paid.');
      fetchVouchers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to mark paid');
    } finally {
      setActioningId(null);
    }
  };

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-[#475467]">Access denied.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#101828]">Vouchers</h1>
          <p className="text-[#475467]">Payment vouchers: create, review, bank upload and mark paid</p>
        </div>
        {isFinanceManager && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#465FFF] text-white rounded-xl font-semibold hover:bg-[#3641F5] transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Create Voucher
          </button>
        )}
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
            onChange={(e) => setFilterStatus(e.target.value as VoucherStatus | '')}
            className="block w-full min-w-[160px] px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || 'all'} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center min-h-64 items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#465FFF] border-t-transparent" />
        </div>
      ) : vouchers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-12 text-center">
          <BanknotesIcon className="h-12 w-12 text-[#98A2B3] mx-auto mb-4" />
          <p className="text-sm font-medium text-[#344054]">No vouchers found</p>
          {isFinanceManager && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 text-[#465FFF] font-semibold hover:underline"
            >
              Create your first voucher
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E4E7EC] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E4E7EC]">
              <thead className="bg-[#F9FAFB]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase">Voucher #</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase">Service Provider</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase">Amount</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase">VAT</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase">Description</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase">Invoice</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase">Created By</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase">Comment</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-[#344054] uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E4E7EC]">
                {vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-[#F9FAFB]">
                    <td className="px-6 py-4 text-sm font-semibold text-[#101828]">{v.voucher_number}</td>
                    <td className="px-6 py-4 text-sm text-[#344054]">
                      {(v as any).sp_company_name || `${(v as any).sp_first_name || ''} ${(v as any).sp_last_name || ''}`.trim() || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#344054]">{Number(v.amount).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-[#344054]">{Number(v.vat).toLocaleString()}</td>
                    <td className="px-6 py-4 text-sm text-[#475467] max-w-[200px] truncate" title={v.description || ''}>{v.description || '-'}</td>
                    <td className="px-6 py-4">
                      {(v as any).invoice_url ? (
                        <a
                          href={`${(typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/api\/?$/, '') : '')}${(v as any).invoice_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[#465FFF] hover:underline"
                        >
                          <DocumentArrowDownIcon className="h-4 w-4" />
                          View
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4">{statusBadge(v.status)}</td>
                    <td className="px-6 py-4 text-sm text-[#475467]">
                      {(v as any).created_by_first_name} {(v as any).created_by_last_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#475467] max-w-[180px]">
                      {v.executive_comment ? (
                        <span className="inline-flex items-center gap-1" title={v.executive_comment}>
                          <ChatBubbleLeftRightIcon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{v.executive_comment}</span>
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        {isFinanceExecutive && v.status === VoucherStatus.PENDING_REVIEW && (
                          <button
                            onClick={() => { setSelectedVoucher(v); setShowReviewModal(true); }}
                            className="text-xs font-semibold text-[#465FFF] hover:underline"
                          >
                            Review
                          </button>
                        )}
                        {isFinanceManager && v.status === VoucherStatus.INFORMATION_REQUEST && (
                          <button
                            onClick={() => handleResubmit(v.id)}
                            disabled={actioningId === v.id}
                            className="text-xs font-semibold text-[#465FFF] hover:underline disabled:opacity-50"
                          >
                            {actioningId === v.id ? 'Resubmitting...' : 'Resubmit'}
                          </button>
                        )}
                        {isFinanceManager && v.status === VoucherStatus.APPROVED && (
                          <button
                            onClick={() => handleBankUpload(v.id)}
                            disabled={actioningId === v.id}
                            className="text-xs font-semibold text-purple-600 hover:underline disabled:opacity-50 inline-flex items-center gap-1"
                          >
                            <ArrowUpTrayIcon className="h-4 w-4" />
                            {actioningId === v.id ? '...' : 'Bank Upload'}
                          </button>
                        )}
                        {isPaymentApprover && v.status === VoucherStatus.BANK_UPLOAD && (
                          <button
                            onClick={() => handleMarkPaid(v.id)}
                            disabled={actioningId === v.id}
                            className="text-xs font-semibold text-emerald-600 hover:underline disabled:opacity-50 inline-flex items-center gap-1"
                          >
                            <CurrencyDollarIcon className="h-4 w-4" />
                            {actioningId === v.id ? '...' : 'Mark Paid'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateVoucherModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
      {showReviewModal && (
        <ReviewVoucherModal
          isOpen={showReviewModal}
          onClose={() => { setShowReviewModal(false); setSelectedVoucher(null); }}
          onSuccess={handleReviewSuccess}
          voucher={selectedVoucher}
        />
      )}
    </div>
  );
}
