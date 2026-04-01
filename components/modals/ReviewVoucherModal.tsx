'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { PaymentVoucher, VoucherStatus } from '@/types';

interface ReviewVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  voucher: PaymentVoucher | null;
}

export default function ReviewVoucherModal({
  isOpen,
  onClose,
  onSuccess,
  voucher,
}: ReviewVoucherModalProps) {
  const [action, setAction] = useState<'approve' | 'reject' | 'information_request'>('approve');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucher) return;
    if ((action === 'reject' || action === 'information_request') && !comment.trim()) {
      setError('Comment is required for Reject and Information Request');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await api.put(`/vouchers/${voucher.id}/review`, { action, comment: comment.trim() || undefined });
      onSuccess();
      onClose();
      setComment('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !voucher) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative rounded-2xl bg-white shadow-xl sm:max-w-lg w-full p-6 text-left">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-[#101828]">Review Voucher {voucher.voucher_number}</h3>
            <button type="button" onClick={onClose} className="text-[#98A2B3] hover:text-[#344054]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mb-4 text-sm text-[#475467]">
            <p><strong>Service Provider:</strong> {voucher.sp_company_name || `${voucher.sp_first_name} ${voucher.sp_last_name}`}</p>
            <p><strong>Amount:</strong> {Number(voucher.amount).toLocaleString()} | VAT: {Number(voucher.vat).toLocaleString()}</p>
            {voucher.description && <p><strong>Description:</strong> {voucher.description}</p>}
          </div>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#344054] mb-2">Action *</label>
              <select
                value={action}
                onChange={(e) => setAction(e.target.value as 'approve' | 'reject' | 'information_request')}
                className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
              >
                <option value="approve">Voucher Approve</option>
                <option value="reject">Voucher Reject</option>
                <option value="information_request">Voucher Information Request</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#344054] mb-2">
                Comment {(action === 'reject' || action === 'information_request') && '*'}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder={action === 'approve' ? 'Optional' : 'Required for Reject and Information Request'}
                className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-[#344054] border border-[#D0D5DD] rounded-lg hover:bg-[#F9FAFB]">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="px-4 py-2.5 text-sm font-semibold text-white bg-[#465FFF] rounded-lg hover:bg-[#3641F5] disabled:opacity-50">
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
