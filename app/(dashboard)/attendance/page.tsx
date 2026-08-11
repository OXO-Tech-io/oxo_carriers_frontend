'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, Clock, LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton, StatCardSkeleton } from '@/components/ui/Skeleton';
import { ActivityBreakdownChart } from '@/components/attendance/ActivityBreakdownChart';
import { MyAttendanceCards } from '@/components/attendance/AttendanceSummaryCards';
import { DesktopAgentCard } from '@/components/attendance/DesktopAgentCard';
import { LiveDurationTimer } from '@/components/attendance/LiveDurationTimer';
import { StatusBadge } from '@/components/attendance/StatusBadge';
import { useAttendanceTracking } from '@/contexts/AttendanceTrackingContext';
import { useTodaySummaryQuery } from '@/hooks/queries/use-attendance-query';
import {
  formatDurationShort,
  formatPercent,
  formatTimeOnly,
  toNumber,
} from '@/lib/attendance/format';
import type { LiveStatus } from '@/types/attendance';

export default function MyAttendancePage() {
  const {
    status: trackingStatus,
    sessionToken,
    clockIn,
    clockOut,
    isStartingSession,
    isEndingSession,
  } = useAttendanceTracking();
  const todayQuery = useTodaySummaryQuery();

  const today = todayQuery.data;
  const summary = today?.summary;

  // The tracker knows this tab's state first-hand; today/summary is a server
  // read that can be up to a poll behind. Prefer the tracker while it is
  // actually running, and fall back to the server's view otherwise. The
  // tracker's `active` is the session status; the badge speaks presence, where
  // the same state is called `online`.
  let status: LiveStatus;
  if (trackingStatus === 'active') {
    status = 'online';
  } else if (trackingStatus === 'idle') {
    status = 'idle';
  } else {
    status = today?.currentStatus ?? 'offline';
  }

  const openSession = today?.sessions.find(
    (session) => session.status === 'active' || session.status === 'idle',
  );
  const firstLoginAt = summary?.firstLoginAt ?? today?.sessions[0]?.loginAt ?? null;
  const isRunning = !!openSession;

  // Time banked by sessions that already closed today, so a second session's
  // ticker continues the day rather than restarting from zero.
  const closedSec = (today?.sessions ?? [])
    .filter((session) => session.id !== openSession?.id)
    .reduce((total, session) => total + (session.totalDurationSec ?? 0), 0);

  if (todayQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">My Attendance</h1>
          <p className="text-[var(--gray-400)]">
            Your work session, activity and productivity for today
          </p>
        </div>
        <Link
          href="/attendance/history"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline"
        >
          View history
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {todayQuery.isError && (
        <div className="flex items-start gap-2 rounded-xl border border-[var(--error)] bg-[var(--error-light)] p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-[var(--error-text)]" />
          <p className="text-xs font-semibold text-[var(--error-text)]">
            Today&apos;s attendance could not be loaded. Please refresh the page.
          </p>
        </div>
      )}

      {/* Live session header */}
      <Card padding="md">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--gray-400)]">
              Time logged today
            </p>
            <LiveDurationTimer
              startedAt={isRunning ? (openSession?.loginAt ?? null) : firstLoginAt}
              paused={!isRunning}
              baseSeconds={closedSec}
              className="block text-4xl font-extrabold tracking-tight text-[var(--foreground)]"
            />
            <p className="text-xs font-semibold text-[var(--gray-400)]">
              {isRunning
                ? 'Counting while this session stays open.'
                : `Total logged: ${formatDurationShort(summary?.totalLoggedSec ?? 0)}`}
            </p>
          </div>

          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="flex items-center gap-3">
              <StatusBadge status={status} />
              {sessionToken ? (
                <Button
                  variant="outline"
                  size="sm"
                  isLoading={isEndingSession}
                  leftIcon={<LogOut className="h-3.5 w-3.5" />}
                  onClick={() => void clockOut()}
                >
                  Clock Out
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  isLoading={isStartingSession}
                  leftIcon={<LogIn className="h-3.5 w-3.5" />}
                  onClick={() => void clockIn()}
                >
                  Clock In
                </Button>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-[var(--gray-400)]">
                <LogIn className="h-3.5 w-3.5" />
                First login {formatTimeOnly(summary?.firstLoginAt ?? firstLoginAt)}
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-[var(--gray-400)]">
                <LogOut className="h-3.5 w-3.5" />
                Last logout {formatTimeOnly(summary?.lastLogoutAt)}
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-[var(--gray-400)]">
                <Clock className="h-3.5 w-3.5" />
                {summary?.sessionCount ?? 0} session
                {(summary?.sessionCount ?? 0) === 1 ? '' : 's'}
              </span>
            </div>
          </div>
        </div>

        {(summary?.isLate || summary?.isEarlyLogout || summary?.hadAbnormalLogout) && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-[var(--gray-50)] pt-3">
            {summary?.isLate && <Flag label="Late login" />}
            {summary?.isEarlyLogout && <Flag label="Early logout" />}
            {summary?.hadAbnormalLogout && <Flag label="Session ended abnormally" />}
          </div>
        )}
      </Card>

      <MyAttendanceCards
        totalLoggedSec={summary?.totalLoggedSec ?? 0}
        activeSec={summary?.activeSec ?? 0}
        idleSec={summary?.idleSec ?? 0}
        efficiencyPct={formatPercent(summary?.efficiencyPct)}
        formatDuration={formatDurationShort}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card padding="md" className="lg:col-span-1">
          <CardHeader title="Activity Breakdown" subtitle="How today's logged time split" />
          <ActivityBreakdownChart
            productiveSec={toNumber(summary?.productiveSec)}
            idleSec={toNumber(summary?.idleSec)}
            unproductiveSec={toNumber(summary?.unproductiveSec)}
          />
        </Card>

        <Card padding="md" className="lg:col-span-2">
          <CardHeader title="Today's Sessions" subtitle="Every sign-in recorded today" />
          {!today?.sessions.length ? (
            <p className="py-6 text-center text-xs font-semibold text-[var(--gray-400)]">
              No sessions recorded today yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[var(--gray-100)]">
                <thead>
                  <tr>
                    {['Started', 'Ended', 'Duration', 'Idle', 'Device', 'Status'].map((header) => (
                      <th
                        key={header}
                        scope="col"
                        className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--gray-400)]"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--gray-50)]">
                  {today.sessions.map((session) => (
                    <tr key={session.id}>
                      <td className="px-3 py-2.5 text-sm text-[var(--foreground)]">
                        {formatTimeOnly(session.loginAt)}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-[var(--foreground)]">
                        {formatTimeOnly(session.logoutAt)}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-[var(--foreground)]">
                        {session.totalDurationSec === null
                          ? 'In progress'
                          : formatDurationShort(session.totalDurationSec)}
                      </td>
                      <td className="px-3 py-2.5 text-sm text-[var(--foreground)]">
                        {formatDurationShort(session.idleSec ?? 0)}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-[var(--gray-400)]">
                        {[session.browser, session.os].filter(Boolean).join(' · ') || '—'}
                      </td>
                      <td className="px-3 py-2.5 text-xs font-semibold capitalize text-[var(--gray-500)]">
                        {session.status.replaceAll('_', ' ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <DesktopAgentCard />
    </div>
  );
}

function Flag({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold"
      style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning-text)' }}
    >
      <AlertTriangle className="h-3 w-3" />
      {label}
    </span>
  );
}
