'use client';

import { TrendingUp } from 'lucide-react';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  /** Optional caption under the value, e.g. "Needs attention". */
  trend?: string;
  /** Lift-on-hover treatment, as used on the main dashboard's KPI row. */
  hover?: boolean;
}

/**
 * KPI tile: accent bar, label, big number, accent icon chip.
 *
 * Extracted from the two identical-but-for-hover copies that lived inline in
 * `app/(dashboard)/page.tsx` and `app/admin/work-logs/page.tsx`. `hover` is
 * what separated them - the dashboard's variant lifts and grows its icon, the
 * work-logs one is static with a slightly smaller icon chip - so both call
 * sites keep exactly the appearance they had.
 */
export function StatCard({
  title,
  value,
  icon: Icon,
  accentColor,
  trend,
  hover = false,
}: StatCardProps) {
  return (
    <Card
      hover={hover}
      padding="md"
      className={`relative overflow-hidden ${hover ? 'group' : ''}`}
    >
      <div className="absolute top-0 left-0 h-1.5 w-full" style={{ backgroundColor: accentColor }} />
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight">{value}</p>
          {trend && (
            <div className="pt-2 flex items-center gap-1 text-[11px] font-semibold text-[var(--gray-500)]">
              <TrendingUp className="h-3.5 w-3.5 text-[var(--primary)]" />
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div
          className={
            hover
              ? 'flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-md transition-transform duration-300 group-hover:scale-110 active:scale-95 shrink-0'
              : 'flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-md shrink-0'
          }
          style={{ backgroundColor: accentColor }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
