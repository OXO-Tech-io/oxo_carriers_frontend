import type { LiveStatus } from '@/types/attendance';

const pad = (value: number) => String(value).padStart(2, '0');

/** `12345` -> `03:25:45`. Negative or non-finite input clamps to zero. */
export function formatHms(totalSeconds: number): string {
  const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.floor(totalSeconds)) : 0;
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/** `12345` -> `3h 25m`. Compact form for tables and KPI tiles. */
export function formatDurationShort(totalSeconds: number | null | undefined): string {
  if (totalSeconds === null || totalSeconds === undefined || !Number.isFinite(totalSeconds)) {
    return '—';
  }
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  if (hours === 0 && minutes === 0) return '0m';
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

export function formatTimeOnly(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDateOnly(value: string | null | undefined): string {
  if (!value) return '—';
  // Daily summaries arrive as plain `YYYY-MM-DD`; parsing those through Date
  // would shift them a day in western timezones, so slice instead.
  const iso = value.slice(0, 10);
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime()) ? iso : date.toLocaleDateString();
}

/**
 * `2m ago` / `3h ago` / `5d ago`, falling back to a plain date past a week so a
 * six-month-old timestamp reads as a date rather than `184d ago`.
 */
export function formatRelativeTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const diffSec = Math.round((Date.now() - date.getTime()) / 1000);
  if (diffSec < 0) return 'just now';
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return date.toLocaleDateString();
}

/** `efficiencyPct` is numeric server-side, so it arrives as a string on summaries. */
export function formatPercent(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? `${parsed.toFixed(1)}%` : '—';
}

export function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export const LIVE_STATUS_LABEL: Record<LiveStatus, string> = {
  online: 'Online',
  idle: 'Idle',
  offline: 'Offline',
};

/** `yyyy-MM-dd` for today, in the browser's local calendar. */
export function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

/** `yyyy-MM-dd` for `days` days before today. */
export function isoDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
