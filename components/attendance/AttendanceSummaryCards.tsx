'use client';

import {
  AlertTriangle,
  Coffee,
  Gauge,
  LogOut,
  Percent,
  Timer,
  UserCheck,
  Users,
  Wifi,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { StatCardSkeleton } from '@/components/ui/Skeleton';
import type { AttendanceDashboardMetrics } from '@/types/attendance';

interface AttendanceSummaryCardsProps {
  metrics: AttendanceDashboardMetrics | undefined;
  isLoading?: boolean;
}

const GRID = 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4';

/** KPI row for the admin attendance dashboard. */
export function AttendanceSummaryCards({ metrics, isLoading = false }: AttendanceSummaryCardsProps) {
  if (isLoading || !metrics) {
    return (
      <div className={GRID}>
        {Array.from({ length: 8 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className={GRID}>
      <StatCard title="Online Now" value={metrics.onlineNow} icon={Wifi} accentColor="var(--chart-productive)" />
      <StatCard title="Idle Now" value={metrics.idleNow} icon={Coffee} accentColor="var(--chart-idle)" />
      <StatCard title="Offline" value={metrics.offlineNow} icon={LogOut} accentColor="#64748b" />
      <StatCard title="Logged In Today" value={metrics.loggedInToday} icon={Users} accentColor="var(--primary)" />
      <StatCard
        title="Avg Working Hours"
        value={`${metrics.avgWorkingHours}h`}
        icon={Timer}
        accentColor="var(--primary)"
      />
      <StatCard
        title="Avg Productivity"
        value={`${metrics.avgProductivityPct}%`}
        icon={Gauge}
        accentColor="var(--chart-productive)"
      />
      <StatCard
        title="Attendance"
        value={`${metrics.attendancePct}%`}
        icon={UserCheck}
        accentColor="var(--primary)"
        trend={`Avg idle ${metrics.avgIdleMinutes} min`}
      />
      <StatCard
        title="Late Logins"
        value={metrics.lateCount}
        icon={AlertTriangle}
        accentColor="var(--chart-idle)"
        trend={`${metrics.earlyLogoutCount} early logout${metrics.earlyLogoutCount === 1 ? '' : 's'}`}
      />
    </div>
  );
}

/** Compact four-tile row for an employee's own day. */
export function MyAttendanceCards({
  totalLoggedSec,
  activeSec,
  idleSec,
  efficiencyPct,
  formatDuration,
}: {
  totalLoggedSec: number;
  activeSec: number;
  idleSec: number;
  efficiencyPct: string;
  formatDuration: (seconds: number) => string;
}) {
  return (
    <div className={GRID}>
      <StatCard
        title="Logged Today"
        value={formatDuration(totalLoggedSec)}
        icon={Timer}
        accentColor="var(--primary)"
      />
      <StatCard
        title="Active"
        value={formatDuration(activeSec)}
        icon={Gauge}
        accentColor="var(--chart-productive)"
      />
      <StatCard title="Idle" value={formatDuration(idleSec)} icon={Coffee} accentColor="var(--chart-idle)" />
      <StatCard title="Efficiency" value={efficiencyPct} icon={Percent} accentColor="var(--primary)" />
    </div>
  );
}
