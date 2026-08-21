'use client';

import { useEffect, useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import { motion } from 'framer-motion';
import { LogIn, LogOut, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/contexts/ToastContext';
import { useAttendanceHistoryQuery } from '@/hooks/queries/use-attendance-query';
import { useClockInMutation, useClockOutMutation } from '@/hooks/mutations/use-attendance-mutations';
import type { AttendanceHistoryDay } from '@/types/attendance';

const HISTORY_DAYS = 5;

// Purely a visual reference for the progress ring - not a target enforced
// anywhere else, just gives the ring something to fill toward.
const WORKDAY_TARGET_SEC = 8 * 60 * 60;
const RING_RADIUS = 42;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

function formatClock(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

function formatTime(iso: string | null): string {
  return iso ? format(new Date(iso), 'h:mm a') : '--:--';
}

function errorMessage(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;
}

export function AttendanceCard() {
  const toast = useToast();
  const todayIso = format(new Date(), 'yyyy-MM-dd');
  const historyStartIso = format(subDays(new Date(), HISTORY_DAYS - 1), 'yyyy-MM-dd');
  // historyQuery's range already covers today (the most recent day, sorted
  // first) - fetching it separately as todayQuery used to was a second,
  // fully redundant network round trip on every load.
  const historyQuery = useAttendanceHistoryQuery({ from: historyStartIso, to: todayIso });
  const clockInMutation = useClockInMutation();
  const clockOutMutation = useClockOutMutation();

  const today = historyQuery.data?.[0];
  const activeSession = today?.sessions.find((s) => s.status === 'active');
  const isActive = Boolean(activeSession);
  const isPending = clockInMutation.isPending || clockOutMutation.isPending;

  // Live-ticking seconds worked today, so the reader watches the number move
  // instead of needing to refresh. Closed sessions contribute their stored
  // total; the open one (if any) adds a per-second delta off its login time.
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(() => setTick(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isActive]);

  const liveSeconds = useMemo(() => {
    if (!today) return 0;
    if (!activeSession?.loginAt) return today.totalDurationSec;
    const closedSeconds = today.sessions
      .filter((s) => s.status !== 'active')
      .reduce((sum, s) => sum + (s.totalDurationSec ?? 0), 0);
    const elapsed = Math.max(0, Math.floor((tick - new Date(activeSession.loginAt).getTime()) / 1000));
    return closedSeconds + elapsed;
  }, [today, activeSession, tick]);

  const progressPct = Math.min(1, liveSeconds / WORKDAY_TARGET_SEC);
  const ringOffset = RING_CIRCUMFERENCE * (1 - progressPct);

  const handleToggle = async () => {
    try {
      if (isActive) {
        await clockOutMutation.mutateAsync();
        toast.success('Clocked out', 'See you next time!');
      } else {
        await clockInMutation.mutateAsync();
        toast.success('Clocked in', 'Have a great day!');
      }
    } catch (err) {
      toast.error(isActive ? 'Could not clock out' : 'Could not clock in', errorMessage(err, 'Please try again'));
    }
  };

  return (
    <Card padding="lg" className="shadow-md">
      <p className="mb-5 text-[10px] uppercase tracking-wider text-[var(--gray-400)] font-bold">Attendance</p>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-center">
        {/* Clock control */}
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={handleToggle}
            disabled={isPending || historyQuery.isLoading}
            aria-label={isActive ? 'Clock out' : 'Clock in'}
            className="relative flex h-24 w-24 shrink-0 items-center justify-center disabled:cursor-not-allowed disabled:opacity-70"
          >
            <svg viewBox="0 0 96 96" className="absolute inset-0 h-full w-full -rotate-90">
              <circle cx="48" cy="48" r={RING_RADIUS} fill="none" stroke="var(--primary-light)" strokeWidth="6" />
              <circle
                cx="48"
                cy="48"
                r={RING_RADIUS}
                fill="none"
                stroke={isActive ? 'var(--primary)' : 'var(--gray-200)'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={ringOffset}
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
            {isActive && (
              <motion.span
                className="absolute inset-1 rounded-full bg-[var(--primary)] opacity-[0.15]"
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            <span
              className={`relative flex h-16 w-16 items-center justify-center rounded-full text-white shadow-[var(--shadow)] transition-colors duration-300 ${
                isActive ? 'bg-[var(--primary)]' : 'bg-[var(--gray-300)]'
              }`}
            >
              {isPending ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : isActive ? (
                <LogOut className="h-6 w-6" />
              ) : (
                <LogIn className="h-6 w-6" />
              )}
            </span>
          </button>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-[var(--gray-400)] font-bold">
              {isActive ? 'Time worked today' : "Today's total"}
            </p>
            <p className="font-mono text-3xl font-extrabold tabular-nums text-[var(--foreground)]">
              {formatClock(liveSeconds)}
            </p>
            <p className="text-xs font-semibold text-[var(--gray-400)]">
              {historyQuery.isLoading
                ? 'Loading...'
                : today?.status === 'none'
                  ? 'Tap the button to clock in'
                  : 'Today'}
            </p>
            {today && today.status !== 'none' && (
              <div className="mt-2 flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--foreground)]">
                  <LogIn className="h-3.5 w-3.5 text-[var(--primary)]" />
                  {formatTime(today.firstLoginAt)}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--foreground)]">
                  <LogOut className="h-3.5 w-3.5 text-[var(--gray-400)]" />
                  {isActive ? '--:--' : formatTime(today.lastLogoutAt)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Recent history */}
        <div className="flex-1 border-t border-[var(--gray-100)] pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
          <p className="mb-3 text-[10px] uppercase tracking-wider text-[var(--gray-400)] font-bold">Last 5 days</p>
          <AttendanceHistoryChart days={historyQuery.data ?? []} loading={historyQuery.isLoading} />
        </div>
      </div>
    </Card>
  );
}

function AttendanceHistoryChart({ days, loading }: { days: AttendanceHistoryDay[]; loading: boolean }) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (loading) {
    return <p className="text-xs font-medium text-[var(--gray-400)]">Loading history...</p>;
  }
  if (days.length === 0) {
    return <p className="text-xs font-medium text-[var(--gray-400)]">No attendance recorded yet.</p>;
  }

  const chronological = [...days].reverse();
  const maxSeconds = Math.max(...chronological.map((d) => d.totalDurationSec), 1);
  const todayKey = format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="flex items-end gap-2">
      {chronological.map((day) => {
        const heightPct = Math.max(4, (day.totalDurationSec / maxSeconds) * 100);
        const isToday = day.date === todayKey;
        return (
          <div key={day.date} className="relative flex flex-1 flex-col items-center gap-1.5">
            {(isToday || hovered === day.date) && (
              <div
                className={`absolute -top-9 z-10 whitespace-nowrap rounded-lg px-2 py-1 text-[10px] font-bold shadow-[var(--shadow-md)] ${
                  isToday
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--foreground)] text-[var(--card-bg)]'
                }`}
              >
                {formatDuration(day.totalDurationSec)}
              </div>
            )}
            <div className="flex h-14 w-full items-end justify-center">
              <div
                onMouseEnter={() => setHovered(day.date)}
                onMouseLeave={() => setHovered(null)}
                className={`w-full max-w-[22px] rounded-t-[4px] transition-all duration-300 ${
                  isToday ? 'bg-[var(--primary)]' : 'bg-[var(--primary)] opacity-40'
                }`}
                style={{ height: `${heightPct}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-[var(--gray-400)]">
              {format(new Date(`${day.date}T00:00:00`), 'EEE')}
            </span>
          </div>
        );
      })}
    </div>
  );
}
