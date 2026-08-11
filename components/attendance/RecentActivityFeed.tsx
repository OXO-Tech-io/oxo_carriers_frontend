'use client';

import { LogIn, LogOut } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDateTime } from '@/lib/attendance/format';
import type { AttendanceActivityEvent } from '@/types/attendance';

interface RecentActivityFeedProps {
  events: AttendanceActivityEvent[] | undefined;
  isLoading?: boolean;
  className?: string;
}

/** Newest-first login/logout stream across the organisation. */
export function RecentActivityFeed({
  events,
  isLoading = false,
  className = '',
}: RecentActivityFeedProps) {
  return (
    <Card padding="md" className={className}>
      <CardHeader title="Recent Activity" subtitle="Logins and logouts, newest first" />

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-2.5 w-24" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !events?.length && (
        <p className="py-6 text-center text-xs font-semibold text-[var(--gray-400)]">
          No attendance activity recorded yet.
        </p>
      )}

      {!isLoading && !!events?.length && (
        <ul className="divide-y divide-[var(--gray-50)]">
          {events.map((event) => {
            const isLogin = event.event === 'login';
            const Icon = isLogin ? LogIn : LogOut;
            const name = `${event.firstName} ${event.lastName}`.trim() || event.employeeId;

            return (
              <li
                key={`${event.sessionId}-${event.event}`}
                className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: isLogin ? 'var(--success-light)' : 'var(--gray-50)',
                    color: isLogin ? 'var(--success-text)' : 'var(--gray-500)',
                  }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-bold text-[var(--foreground)]">{name}</p>
                    <p className="shrink-0 text-[10px] font-semibold text-[var(--gray-400)]">
                      {formatDateTime(event.at)}
                    </p>
                  </div>
                  <p className="truncate text-xs font-semibold text-[var(--gray-400)]">
                    {isLogin ? 'Signed in' : 'Signed out'}
                    {event.department ? ` · ${event.department}` : ''}
                    {!isLogin && event.endReason
                      ? ` · ${event.endReason.replaceAll('_', ' ')}`
                      : ''}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
