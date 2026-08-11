'use client';

import type { LiveStatus } from '@/types/attendance';
import { LIVE_STATUS_LABEL } from '@/lib/attendance/format';

interface StatusBadgeProps {
  status: LiveStatus;
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Presence pill. Status is always carried by the written label as well as the
 * dot, so it never depends on colour alone.
 */
const TONE: Record<LiveStatus, { dot: string; text: string; bg: string; border: string }> = {
  online: {
    dot: 'var(--success)',
    text: 'var(--success-text)',
    bg: 'var(--success-light)',
    border: 'var(--success)',
  },
  idle: {
    dot: 'var(--warning)',
    text: 'var(--warning-text)',
    bg: 'var(--warning-light)',
    border: 'var(--warning)',
  },
  offline: {
    dot: 'var(--gray-300)',
    text: 'var(--gray-500)',
    bg: 'var(--gray-50)',
    border: 'var(--gray-200)',
  },
};

export function StatusBadge({ status, size = 'md', className = '' }: StatusBadgeProps) {
  const tone = TONE[status] ?? TONE.offline;
  const sizing = size === 'sm' ? 'px-2 py-0.5 text-[10px] gap-1.5' : 'px-2.5 py-1 text-xs gap-2';

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold ${sizing} ${className}`}
      style={{
        backgroundColor: tone.bg,
        color: tone.text,
        border: `1px solid ${tone.border}`,
      }}
    >
      <span
        className={`inline-block rounded-full ${size === 'sm' ? 'h-1.5 w-1.5' : 'h-2 w-2'} ${
          status === 'online' ? 'animate-pulse' : ''
        }`}
        style={{ backgroundColor: tone.dot }}
        aria-hidden
      />
      {LIVE_STATUS_LABEL[status] ?? 'Unknown'}
    </span>
  );
}
