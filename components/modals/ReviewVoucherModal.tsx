'use client';

import { useState } from 'react';
import api from '@/lib/api';
import { PaymentVoucher, VoucherStatus } from '@/types';
import { API_FILE_BASE_URL as apiBaseUrl } from '@/lib/constants';

interface ReviewVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  voucher: PaymentVoucher | null;
}

type ReviewAction = 'approve' | 'reject';

const REASON_REQUIRED = 'A rejection reason is required';

function personName(first?: string, last?: string) {
  return `${first || ''} ${last || ''}`.trim();
}

export default function ReviewVoucherModal({
  isOpen,
  onClose,
  onSuccess,
  voucher,
}: ReviewVoucherModalProps) {
  const [action, setAction] = useState<ReviewAction>('approve');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isAdminStage = voucher?.status === VoucherStatus.PENDING_ADMIN_REVIEW;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucher) return;
    if (action === 'reject' && !comment.trim()) {
      setError(REASON_REQUIRED);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await api.put(`/vouchers/${voucher.id}/reviews`, {
        action,
        comment: action === 'reject' ? comment.trim() : undefined,
      });
      onSuccess();
      onClose();
      setComment('');
      setAction('approve');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !voucher) return null;

  const amount = Number(voucher.amount);
  const vat = Number(voucher.vat);
  const provider = voucher.sp_company_name || personName(voucher.sp_first_name, voucher.sp_last_name) || '-';
  const creator = personName(voucher.created_by_first_name, voucher.created_by_last_name);
  const managerApprover = personName(voucher.manager_reviewed_by_first_name, voucher.manager_reviewed_by_last_name);

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative rounded-2xl bg-white shadow-xl sm:max-w-lg w-full p-6 text-left">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-xl font-bold text-[#101828]">Review Voucher {voucher.voucher_number}</h3>
            <button type="button" onClick={onClose} aria-label="Close" className="text-[#98A2B3] hover:text-[#344054]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-xs font-semibold text-[#667085] mb-4">
            {isAdminStage ? 'Administrator approval (final)' : 'Finance Manager review'}
          </p>

          <dl className="mb-4 rounded-xl border border-[#E4E7EC] bg-[#F9FAFB] p-3 text-sm text-[#475467] space-y-1">
            <div className="flex justify-between gap-4">
              <dt className="font-semibold">Service Provider</dt>
              <dd className="text-right">{provider}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-semibold">Amount</dt>
              <dd className="text-right">{amount.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="font-semibold">VAT</dt>
              <dd className="text-right">{vat.toLocaleString()}</dd>
            </div>
            <div className="flex justify-between gap-4 border-t border-[#E4E7EC] pt-1 text-[#101828]">
              <dt className="font-bold">Total</dt>
              <dd className="text-right font-bold">{(amount + vat).toLocaleString()}</dd>
            </div>
            {creator && (
              <div className="flex justify-between gap-4">
                <dt className="font-semibold">Created by</dt>
                <dd className="text-right">{creator}</dd>
              </div>
            )}
            {isAdminStage && managerApprover && (
              <div className="flex justify-between gap-4">
                <dt className="font-semibold">Approved by Finance Manager</dt>
                <dd className="text-right">{managerApprover}</dd>
              </div>
            )}
            {voucher.description && (
              <div className="pt-1">
                <dt className="font-semibold">Description</dt>
                <dd>{voucher.description}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4 pt-1">
              <dt className="font-semibold">Bill / supporting document</dt>
              <dd className="text-right">
                {voucher.invoice_url ? (
                  <a
                    href={`${apiBaseUrl}${voucher.invoice_url}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[#465FFF] hover:underline"
                  >
                    View
                  </a>
                ) : (
                  'None attached'
                )}
              </dd>
            </div>
          </dl>

          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="voucher-review-action" className="block text-sm font-semibold text-[#344054] mb-2">
                Action *
              </label>
              <select
                id="voucher-review-action"
                value={action}
                onChange={(e) => {
                  setAction(e.target.value as ReviewAction);
                  setError('');
                }}
                className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
              >
                <option value="approve">{isAdminStage ? 'Approve voucher' : 'Approve and send to Administrator'}</option>
                <option value="reject">Reject voucher</option>
              </select>
            </div>
            {action === 'reject' && (
              <div>
                <label htmlFor="voucher-review-comment" className="block text-sm font-semibold text-[#344054] mb-2">
                  Rejection reason *
                </label>
                <textarea
                  id="voucher-review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="Required: tell the creator why this voucher was rejected"
                  className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                />
              </div>
            )}
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
