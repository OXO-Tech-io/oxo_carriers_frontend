'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface ProfileChangeDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  decision: 'rejected' | 'returned_for_modification';
  onConfirm: (reviewerComments: string) => void | Promise<void>;
  isLoading?: boolean;
}

const COPY: Record<ProfileChangeDecisionModalProps['decision'], { title: string; label: string; placeholder: string }> = {
  rejected: {
    title: 'Reject Change Request',
    label: 'Reason for rejection',
    placeholder: 'Explain why this request is being rejected...',
  },
  returned_for_modification: {
    title: 'Return for Modification',
    label: 'What needs to change?',
    placeholder: 'Let the employee know what to fix before resubmitting...',
  },
};

export default function ProfileChangeDecisionModal({
  isOpen,
  onClose,
  decision,
  onConfirm,
  isLoading = false,
}: ProfileChangeDecisionModalProps) {
  const [comments, setComments] = useState('');
  const copy = COPY[decision];
  const trimmed = comments.trim();

  const handleConfirm = async () => {
    if (!trimmed) return;
    await onConfirm(trimmed);
    setComments('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={copy.title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={decision === 'rejected' ? 'danger' : 'primary'}
            onClick={handleConfirm}
            isLoading={isLoading}
            disabled={!trimmed}
          >
            {decision === 'rejected' ? 'Reject Request' : 'Return to Employee'}
          </Button>
        </>
      }
    >
      <div>
        <label className="block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">
          {copy.label} <span className="text-red-500">*</span>
        </label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={4}
          placeholder={copy.placeholder}
          className="block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
        />
      </div>
    </Modal>
  );
}
