'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, LogOut } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { AttendanceAccessGate } from '@/components/attendance/AttendanceAccessGate';
import { AttendanceBarChart, type BarDatum } from '@/components/attendance/AttendanceBarChart';
import { AttendanceSummaryCards } from '@/components/attendance/AttendanceSummaryCards';
import { LeaderboardCard } from '@/components/attendance/LeaderboardCard';
import { RecentActivityFeed } from '@/components/attendance/RecentActivityFeed';
import {
  useAdminDashboardMetricsQuery,
  useLeastProductiveQuery,
  useRecentActivityQuery,
  useTopProductiveQuery,
} from '@/hooks/queries/use-attendance-query';
import { isoDaysAgo, todayIso } from '@/lib/attendance/format';

const RANK_RANGE = { from: isoDaysAgo(29), to: todayIso(), limit: 5 };

function AdminAttendanceDashboard() {
  const metricsQuery = useAdminDashboardMetricsQuery();
  const recentQuery = useRecentActivityQuery(12);
  const topQuery = useTopProductiveQuery(RANK_RANGE);
  const leastQuery = useLeastProductiveQuery(RANK_RANGE);

  const metrics = metricsQuery.data;

  // Presence right now, as a magnitude comparison. The metrics endpoint has no
  // per-department series, so the honest chart here is the live headcount split
  // rather than a department breakdown that would have to be invented.
  const presence: BarDatum[] = metrics
    ? [
        { label: 'Online', value: metrics.onlineNow },
        { label: 'Idle', value: metrics.idleNow },
        { label: 'Offline', value: metrics.offlineNow },
      ]
    : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Attendance Overview</h1>
          <p className="text-[var(--gray-400)]">
            Live presence, productivity and attendance for {metrics?.date ?? 'today'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/admin/attendance/live"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline"
          >
            Live monitoring
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/admin/attendance/history"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline"
          >
            Full history
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {metricsQuery.isError && (
        <div className="flex items-start gap-2 rounded-xl border border-[var(--error)] bg-[var(--error-light)] p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-[var(--error-text)]" />
          <p className="text-xs font-semibold text-[var(--error-text)]">
            Attendance metrics could not be loaded.
          </p>
        </div>
      )}

      <AttendanceSummaryCards metrics={metrics} isLoading={metricsQuery.isLoading} />

      {/* Call-outs: the two exception counts HR acts on. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CallOut
          icon={AlertTriangle}
          title="Late logins today"
          count={metrics?.lateCount ?? 0}
          description="Sessions that started after the configured late-login time."
        />
        <CallOut
          icon={LogOut}
          title="Early logouts today"
          count={metrics?.earlyLogoutCount ?? 0}
          description="Sessions closed before the configured early-logout time."
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card padding="md" className="lg:col-span-2">
          <CardHeader
            title="Presence right now"
            subtitle="Headcount by live status across the organisation"
          />
          <AttendanceBarChart
            data={presence}
            valueLabel="Employees"
            height={220}
            emptyMessage="No presence data yet today."
          />
        </Card>

        <RecentActivityFeed
          events={recentQuery.data}
          isLoading={recentQuery.isLoading}
          className="lg:col-span-1"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LeaderboardCard
          title="Most Productive"
          subtitle="Mean daily efficiency over the last 30 days"
          rows={topQuery.data}
          isLoading={topQuery.isLoading}
        />
        <LeaderboardCard
          title="Needs Attention"
          subtitle="Lowest mean daily efficiency over the last 30 days"
          rows={leastQuery.data}
          isLoading={leastQuery.isLoading}
        />
      </div>
    </div>
  );
}

function CallOut({
  icon: Icon,
  title,
  count,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count: number;
  description: string;
}) {
  const isClear = count === 0;
  return (
    <Card padding="md">
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor: isClear ? 'var(--success-light)' : 'var(--warning-light)',
            color: isClear ? 'var(--success-text)' : 'var(--warning-text)',
          }}
        >
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-extrabold text-[var(--foreground)]">{count}</p>
            <p className="text-sm font-bold text-[var(--foreground)]">{title}</p>
          </div>
          <p className="mt-0.5 text-xs text-[var(--gray-400)]">{description}</p>
        </div>
      </div>
    </Card>
  );
}

export default function AdminAttendancePage() {
  return (
    <AttendanceAccessGate requiredLevel="read">
      <AdminAttendanceDashboard />
    </AttendanceAccessGate>
  );
}
