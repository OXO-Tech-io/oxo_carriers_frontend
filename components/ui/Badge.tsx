'use client';

import { ReactNode } from 'react';

export type BadgeVariant = 'primary' | 'purple' | 'success' | 'warning' | 'error' | 'info' | 'gray';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  icon?: ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  primary: 'bg-[var(--primary-light)] text-[var(--primary)]',
  purple: 'bg-[var(--purple-light)] text-[var(--purple-text)]',
  success: 'bg-[var(--success-light)] text-[var(--success-text)]',
  warning: 'bg-[var(--warning-light)] text-[var(--warning-text)]',
  error: 'bg-[var(--error-light)] text-[var(--error-text)]',
  info: 'bg-[var(--info-light)] text-[var(--info-text)]',
  gray: 'bg-[var(--gray-100)] text-[var(--gray-500)]',
};

/** Soft pastel-bg, saturated-text pill tag - e.g. leave/voucher status, "Urgent", "In progress". */
export function Badge({ children, variant = 'gray', icon, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap ${variants[variant]} ${className}`}
    >
      {icon}
      {children}
    </span>
  );
}
