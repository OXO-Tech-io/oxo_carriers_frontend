'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AttendanceAccessGate } from '@/components/attendance/AttendanceAccessGate';
import { LiveEmployeeGrid } from '@/components/attendance/LiveEmployeeGrid';
import { StatusBadge } from '@/components/attendance/StatusBadge';
import { useLiveSessionsQuery } from '@/hooks/queries/use-attendance-query';
import type { LiveStatus } from '@/types/attendance';

const FIELD =
  'mt-1 w-full rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none';

const LABEL = 'text-xs font-semibold text-[var(--gray-400)]';

const STATUSES: LiveStatus[] = ['online', 'idle', 'offline'];

function LiveMonitoring() {
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState<LiveStatus | ''>('');

  const filters = useMemo(
    () => ({
      department: department.trim() || undefined,
      status: status || undefined,
    }),
    [department, status],
  );

  // Polls every 12s while the tab is visible - see useLiveSessionsQuery.
  const liveQuery = useLiveSessionsQuery(filters);
  const liveData = liveQuery.data;
  const rows = useMemo(() => liveData ?? [], [liveData]);

  // Counts come from the returned rows, so they always agree with the grid
  // below them even when a status filter is applied.
  const counts = useMemo(
    () => ({
      online: rows.filter((row) => row.status === 'online').length,
      idle: rows.filter((row) => row.status === 'idle').length,
      offline: rows.filter((row) => row.status === 'offline').length,
    }),
    [rows],
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Live Monitoring</h1>
          <p className="text-[var(--gray-400)]">
            Open work sessions, refreshed automatically every few seconds
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void liveQuery.refetch()}
          isLoading={liveQuery.isFetching}
          leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
        >
          Refresh
        </Button>
      </div>

      {liveQuery.isError && (
        <div className="flex items-start gap-2 rounded-xl border border-[var(--error)] bg-[var(--error-light)] p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-[var(--error-text)]" />
          <p className="text-xs font-semibold text-[var(--error-text)]">
            Live sessions could not be loaded.
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--gray-100)] bg-[var(--card-bg)] p-4">
        {STATUSES.map((value) => (
          <span key={value} className="flex items-center gap-2">
            <StatusBadge status={value} size="sm" />
            <span className="text-lg font-extrabold text-[var(--foreground)]">
              {counts[value]}
            </span>
          </span>
        ))}
        <span className="ml-auto text-xs font-semibold text-[var(--gray-400)]">
          {rows.length} session{rows.length === 1 ? '' : 's'} shown
        </span>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[var(--gray-100)] bg-[var(--card-bg)] p-4 sm:grid-cols-2 lg:max-w-xl">
        <div>
          <label className={LABEL} htmlFor="live-department">
            Department
          </label>
          <input
            id="live-department"
            type="text"
            placeholder="All departments"
            className={FIELD}
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          />
        </div>
        <div>
          <label className={LABEL} htmlFor="live-status">
            Status
          </label>
          <select
            id="live-status"
            className={FIELD}
            value={status}
            onChange={(e) => setStatus(e.target.value as LiveStatus | '')}
          >
            <option value="">All statuses</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <LiveEmployeeGrid rows={rows} isLoading={liveQuery.isLoading} />
    </div>
  );
}

export default function AdminAttendanceLivePage() {
  return (
    <AttendanceAccessGate requiredLevel="read">
      <LiveMonitoring />
    </AttendanceAccessGate>
  );
}
