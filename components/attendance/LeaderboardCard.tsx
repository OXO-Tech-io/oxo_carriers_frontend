'use client';

import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatPercent } from '@/lib/attendance/format';
import type { ProductivityRankRow } from '@/types/attendance';

interface LeaderboardCardProps {
  title: string;
  subtitle?: string;
  rows: ProductivityRankRow[] | undefined;
  isLoading?: boolean;
  className?: string;
}

/** Ranked efficiency list — used for both the top and least productive boards. */
export function LeaderboardCard({
  title,
  subtitle,
  rows,
  isLoading = false,
  className = '',
}: LeaderboardCardProps) {
  return (
    <Card padding="md" className={className}>
      <CardHeader title={title} subtitle={subtitle} />

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
      )}

      {!isLoading && !rows?.length && (
        <p className="py-6 text-center text-xs font-semibold text-[var(--gray-400)]">
          Not enough tracked days to rank anyone yet.
        </p>
      )}

      {!isLoading && !!rows?.length && (
        <ol className="space-y-2.5">
          {rows.map((row, index) => (
            <li key={row.employeeId} className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--gray-50)] text-xs font-bold text-[var(--gray-500)]">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[var(--foreground)]">{row.name}</p>
                <p className="truncate text-[11px] font-semibold text-[var(--gray-400)]">
                  {row.department ?? 'No department'} · {row.daysTracked} day
                  {row.daysTracked === 1 ? '' : 's'} · {row.totalLoggedHours}h logged
                </p>
              </div>
              <span className="shrink-0 text-sm font-extrabold text-[var(--foreground)] tabular-nums">
                {formatPercent(row.efficiencyPct)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
