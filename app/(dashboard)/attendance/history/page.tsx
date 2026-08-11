'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { AttendanceFiltersBar } from '@/components/attendance/AttendanceFiltersBar';
import { AttendanceHistoryTable } from '@/components/attendance/AttendanceHistoryTable';
import { ExportButtons } from '@/components/attendance/ExportButtons';
import { useAuth } from '@/hooks/useAuth';
import { useMyAttendanceHistoryQuery } from '@/hooks/queries/use-attendance-query';
import { useAttendanceAccess } from '@/hooks/queries/use-my-permissions-query';
import { attendanceService } from '@/lib/services/attendance.service';
import { formatDurationShort, isoDaysAgo, todayIso, toNumber } from '@/lib/attendance/format';
import type {
  AttendanceExportFormat,
  AttendanceHistoryParams,
  AttendanceHistoryRow,
  EmployeeDailySummary,
} from '@/types/attendance';

const DEFAULT_FILTERS: AttendanceHistoryParams = { from: isoDaysAgo(29), to: todayIso() };

/**
 * The self-service history endpoint returns raw daily summaries; the shared
 * table renders the admin history row shape. Employee identity is filled from
 * the signed-in user, since the endpoint is scoped to them by the token.
 */
const toTableRow = (
  summary: EmployeeDailySummary,
  name: string,
  department: string | null,
): AttendanceHistoryRow => ({
  id: summary.id,
  employeeId: summary.employeeId,
  name,
  department,
  summaryDate: summary.summaryDate,
  firstLoginAt: summary.firstLoginAt,
  lastLogoutAt: summary.lastLogoutAt,
  totalLoggedSec: summary.totalLoggedSec,
  activeSec: summary.activeSec,
  idleSec: summary.idleSec,
  productiveSec: summary.productiveSec,
  unproductiveSec: summary.unproductiveSec,
  efficiencyPct: summary.efficiencyPct === null ? null : toNumber(summary.efficiencyPct),
  sessionCount: summary.sessionCount,
  isLate: summary.isLate,
  isEarlyLogout: summary.isEarlyLogout,
  hadAbnormalLogout: summary.hadAbnormalLogout,
  status: summary.status,
});

export default function MyAttendanceHistoryPage() {
  const { user } = useAuth();
  const [filters, setFilters] = useState<AttendanceHistoryParams>(DEFAULT_FILTERS);

  const historyQuery = useMyAttendanceHistoryQuery({ from: filters.from, to: filters.to });
  // The export endpoint sits behind attendance:read, so the buttons only appear
  // for users who could actually use them.
  const { canAccess: canExport } = useAttendanceAccess('read');

  const name = user ? `${user.first_name} ${user.last_name}`.trim() : '';
  const department = user?.department ?? null;

  const rows = useMemo(() => {
    const summaries = historyQuery.data ?? [];
    const mapped = summaries.map((summary) => toTableRow(summary, name, department));
    // `status` is filtered client-side: GET attendance/me/history only accepts
    // from/to, so there is no server-side status filter to defer to here.
    return filters.status ? mapped.filter((row) => row.status === filters.status) : mapped;
  }, [historyQuery.data, name, department, filters.status]);

  const totals = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          logged: acc.logged + row.totalLoggedSec,
          active: acc.active + row.activeSec,
          idle: acc.idle + row.idleSec,
          present: acc.present + (row.status === 'present' ? 1 : 0),
        }),
        { logged: 0, active: 0, idle: 0, present: 0 },
      ),
    [rows],
  );

  const handleExport = (format: AttendanceExportFormat) =>
    attendanceService.exportHistory(format, {
      employeeId: user?.employee_id,
      from: filters.from,
      to: filters.to,
      status: filters.status,
    });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href="/attendance"
            className="mb-1 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to my attendance
          </Link>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Attendance History</h1>
          <p className="text-[var(--gray-400)]">Your day-by-day attendance and productivity</p>
        </div>
        {canExport && <ExportButtons onExport={handleExport} disabled={!rows.length} />}
      </div>

      <AttendanceFiltersBar
        value={filters}
        onChange={setFilters}
        onReset={() => setFilters(DEFAULT_FILTERS)}
        showEmployeeFilters={false}
      />

      <Card padding="md">
        <CardHeader
          title="Period totals"
          subtitle={`${rows.length} day${rows.length === 1 ? '' : 's'} in range`}
        />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Total label="Total logged" value={formatDurationShort(totals.logged)} />
          <Total label="Active" value={formatDurationShort(totals.active)} />
          <Total label="Idle" value={formatDurationShort(totals.idle)} />
          <Total label="Days present" value={String(totals.present)} />
        </div>
      </Card>

      <AttendanceHistoryTable
        rows={rows}
        isLoading={historyQuery.isLoading}
        showEmployee={false}
        pageSize={15}
      />
    </div>
  );
}

function Total({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--gray-400)]">
        {label}
      </p>
      <p className="mt-0.5 text-xl font-extrabold text-[var(--foreground)]">{value}</p>
    </div>
  );
}
