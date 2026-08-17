'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import { Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { useAllAttendanceQuery } from '@/hooks/queries/use-attendance-query';
import { Card, DataTable } from '@/components/ui';
import type { AttendanceHistoryDayForEmployee } from '@/types/attendance';

const todayIso = () => new Date().toISOString().slice(0, 10);

function formatTime(iso: string | null): string {
  return iso ? format(new Date(iso), 'h:mm a') : '--:--';
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}

interface EmployeeAttendanceSummary {
  employeeId: string;
  firstName: string;
  lastName: string;
  daysPresent: number;
  sessionCount: number;
  totalDurationSec: number;
}

function summarizeByEmployee(rows: AttendanceHistoryDayForEmployee[]): EmployeeAttendanceSummary[] {
  const byEmployee = new Map<string, EmployeeAttendanceSummary>();

  for (const row of rows) {
    const existing = byEmployee.get(row.employeeId);
    if (existing) {
      existing.daysPresent += 1;
      existing.sessionCount += row.sessionCount;
      existing.totalDurationSec += row.totalDurationSec;
    } else {
      byEmployee.set(row.employeeId, {
        employeeId: row.employeeId,
        firstName: row.firstName,
        lastName: row.lastName,
        daysPresent: 1,
        sessionCount: row.sessionCount,
        totalDurationSec: row.totalDurationSec,
      });
    }
  }

  return [...byEmployee.values()].sort((a, b) => b.totalDurationSec - a.totalDurationSec);
}

function EmployeeHoursCard({ summary }: { summary: EmployeeAttendanceSummary }) {
  return (
    <Card padding="md" className="relative overflow-hidden">
      <div className="absolute top-0 left-0 h-1.5 w-full" style={{ backgroundColor: 'var(--primary)' }} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-sm font-bold text-[var(--foreground)]">
            {summary.firstName} {summary.lastName}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-[var(--gray-400)] font-bold">Total Hours</p>
          <p className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
            {formatDuration(summary.totalDurationSec)}
          </p>
          <p className="text-xs font-medium text-[var(--gray-400)]">
            {summary.daysPresent} {summary.daysPresent === 1 ? 'day' : 'days'} · {summary.sessionCount}{' '}
            {summary.sessionCount === 1 ? 'session' : 'sessions'}
          </p>
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
          style={{ backgroundColor: 'var(--primary)' }}
        >
          <Clock className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

export default function AdminAttendancePage() {
  const { user, isSuperAdmin } = useAuth();

  const [from, setFrom] = useState(todayIso());
  const [to, setTo] = useState(todayIso());

  const [accessLoading, setAccessLoading] = useState(true);
  const [canView, setCanView] = useState(false);

  useEffect(() => {
    const resolveAccess = async () => {
      if (isSuperAdmin) {
        setCanView(true);
        setAccessLoading(false);
        return;
      }
      if (!user) {
        setCanView(false);
        setAccessLoading(false);
        return;
      }
      try {
        setAccessLoading(true);
        const res = await api.get('/permissions/me');
        const level = res.data?.permissionLevels?.attendance;
        setCanView(level === 'read' || level === 'write');
      } catch {
        setCanView(false);
      } finally {
        setAccessLoading(false);
      }
    };

    resolveAccess();
  }, [isSuperAdmin, user?.id]);

  const attendanceQuery = useAllAttendanceQuery({ from, to }, canView);

  const summaryData = useMemo(() => summarizeByEmployee(attendanceQuery.data ?? []), [attendanceQuery.data]);

  const columns = useMemo<ColumnDef<AttendanceHistoryDayForEmployee, any>[]>(
    () => [
      {
        header: 'Employee',
        cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`,
      },
      { accessorKey: 'employeeId', header: 'Employee ID' },
      {
        accessorKey: 'date',
        header: 'Date',
        cell: ({ row }) => format(new Date(`${row.original.date}T00:00:00`), 'MMM d, yyyy'),
      },
      {
        header: 'First Clock In',
        cell: ({ row }) => formatTime(row.original.firstLoginAt),
      },
      {
        header: 'Last Clock Out',
        cell: ({ row }) => formatTime(row.original.lastLogoutAt),
      },
      {
        header: 'Total Hours',
        cell: ({ row }) => formatDuration(row.original.totalDurationSec),
      },
      { accessorKey: 'sessionCount', header: 'Sessions' },
    ],
    [],
  );

  if (accessLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="rounded-2xl bg-white border border-[var(--gray-200)] p-10 text-center text-[var(--gray-500)] shadow-[var(--shadow-sm)]">
          Checking permission access...
        </div>
      </div>
    );
  }

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-sm">
          <Clock className="h-16 w-16 mx-auto mb-4 text-[var(--gray-300)]" />
          <h2 className="text-xl font-bold text-[var(--gray-700)]">Access Denied</h2>
          <p className="mt-2 text-[var(--gray-500)]">You do not have permission to view attendance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Attendance</h1>
        <p className="text-[var(--gray-400)]">
          Every employee's clock in/out time and daily worked hours.
          {isSuperAdmin && ' As super admin, you see all records with no restrictions.'}
        </p>
      </div>

      <Card padding="md">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-xs font-semibold text-[var(--gray-400)]">From</label>
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="mt-1 block rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-2 text-sm text-[var(--foreground)]"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-[var(--gray-400)]">To</label>
            <input
              type="date"
              value={to}
              min={from}
              max={todayIso()}
              onChange={(e) => setTo(e.target.value)}
              className="mt-1 block rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-2 text-sm text-[var(--foreground)]"
            />
          </div>
        </div>
      </Card>

      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Summary</h2>
        <p className="mb-3 text-xs text-[var(--gray-400)]">
          Total worked hours per employee for {from === to ? format(new Date(`${from}T00:00:00`), 'MMM d, yyyy') : `${from} to ${to}`}.
        </p>
        {attendanceQuery.isLoading ? (
          <p className="text-sm text-[var(--gray-400)]">Loading...</p>
        ) : summaryData.length === 0 ? (
          <p className="text-sm text-[var(--gray-400)]">No attendance recorded for this range.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {summaryData.map((summary) => (
              <EmployeeHoursCard key={summary.employeeId} summary={summary} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-bold text-[var(--foreground)]">Daily Breakdown</h2>
        <p className="mb-3 text-xs text-[var(--gray-400)]">One row per employee per day.</p>
        <DataTable columns={columns} data={attendanceQuery.data ?? []} isLoading={attendanceQuery.isLoading} />
      </div>
    </div>
  );
}
