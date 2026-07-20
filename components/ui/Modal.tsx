'use client';

import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
  footer?: ReactNode;
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
};

// Base modal primitive - every other modal in this app (ProfileChangeRequestModal,
// EducationChangeModal, WorkHistoryChangeModal, ProfileChangeDiffModal,
// ProfileChangeDecisionModal, ConfirmationDialog) is built on top of this.
export function Modal({ isOpen, onClose, title, size = 'md', children, footer }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden
        />
        <div
          className={`relative transform overflow-hidden rounded-2xl bg-[var(--card-bg)] text-left shadow-[var(--shadow-lg)] transition-all sm:my-8 sm:w-full border border-[var(--gray-100)] ${sizeClasses[size]}`}
        >
          {title && (
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[var(--gray-50)]">
              <h3 id="modal-title" className="text-lg font-bold text-[var(--foreground)]">
                {title}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="text-[var(--gray-400)] hover:text-[var(--foreground)] p-1 rounded-lg hover:bg-[var(--gray-50)] transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
          <div className="px-6 py-5 max-h-[70vh] overflow-y-auto">{children}</div>
          {footer && (
            <div className="px-6 py-4 border-t border-[var(--gray-50)] flex items-center justify-end gap-3">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
