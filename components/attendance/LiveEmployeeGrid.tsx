'use client';

import { AlertTriangle, Monitor } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from './StatusBadge';
import { LiveDurationTimer } from './LiveDurationTimer';
import { formatDurationShort, formatTimeOnly } from '@/lib/attendance/format';
import type { LiveSessionRow } from '@/types/attendance';

interface LiveEmployeeGridProps {
  rows: LiveSessionRow[];
  isLoading?: boolean;
}

/** Card grid of everyone with a session open right now. */
export function LiveEmployeeGrid({ rows, isLoading = false }: LiveEmployeeGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} padding="md">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-3 h-3 w-24" />
            <Skeleton className="mt-4 h-8 w-28" />
          </Card>
        ))}
      </div>
    );
  }

  if (!rows.length) {
    return (
      <EmptyState
        title="No one is signed in"
        description="Live sessions appear here as employees start their day."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((row) => {
        const name = `${row.firstName} ${row.lastName}`.trim() || row.employeeId;
        const device = [row.browser, row.deviceType].filter(Boolean).join(' · ');
        // The server has already measured how long this session has been
        // running; the ticker only extends that while the row is on screen.
        const isRunning = row.status !== 'offline';

        return (
          <Card key={row.sessionId} padding="md" className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[var(--foreground)]">{name}</p>
                <p className="truncate text-xs font-semibold text-[var(--gray-400)]">
                  {row.employeeId}
                  {row.department ? ` · ${row.department}` : ''}
                </p>
              </div>
              <StatusBadge status={row.status} size="sm" />
            </div>

            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--gray-400)]">
                  Working time
                </p>
                {isRunning && row.loginAt ? (
                  <LiveDurationTimer
                    startedAt={row.loginAt}
                    className="text-xl font-extrabold text-[var(--foreground)]"
                  />
                ) : (
                  <span className="text-xl font-extrabold text-[var(--foreground)]">
                    {formatDurationShort(row.workingDurationSec)}
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--gray-400)]">
                  Since
                </p>
                <p className="text-xs font-bold text-[var(--foreground)]">
                  {formatTimeOnly(row.loginAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 border-t border-[var(--gray-50)] pt-2.5">
              <span className="flex min-w-0 items-center gap-1.5 text-[11px] font-semibold text-[var(--gray-400)]">
                <Monitor className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{device || 'Unknown device'}</span>
              </span>
              {row.isLate && (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--warning-light)] px-2 py-0.5 text-[10px] font-bold text-[var(--warning-text)]">
                  <AlertTriangle className="h-3 w-3" />
                  Late
                </span>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
