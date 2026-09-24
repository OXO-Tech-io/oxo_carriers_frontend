'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface RejectLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

// Replaces the browser-native `prompt()` rejection dialog with an
// app-styled modal (OCD-508). The reason is required - Reject stays
// disabled until something is typed.
export function RejectLeaveModal({ isOpen, onClose, onConfirm, isLoading = false }: RejectLeaveModalProps) {
  const [reason, setReason] = useState('');

  const handleClose = () => {
    setReason('');
    onClose();
  };

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reject Leave Request"
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={!reason.trim()} isLoading={isLoading}>
            Reject
          </Button>
        </>
      }
    >
      <label className="block text-xs font-bold text-[var(--gray-500)] uppercase tracking-wider mb-2">
        Rejection Reason *
      </label>
      <textarea
        autoFocus
        required
        rows={4}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Please explain why this leave request is being rejected..."
        className="block w-full px-3 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] placeholder:text-[var(--gray-300)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
      />
    </Modal>
  );
}
