'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { AttendanceAccessGate } from '@/components/attendance/AttendanceAccessGate';
import { AttendanceFiltersBar } from '@/components/attendance/AttendanceFiltersBar';
import { AttendanceHistoryTable } from '@/components/attendance/AttendanceHistoryTable';
import { ExportButtons } from '@/components/attendance/ExportButtons';
import { useAdminAttendanceHistoryQuery } from '@/hooks/queries/use-attendance-query';
import { attendanceService } from '@/lib/services/attendance.service';
import { isoDaysAgo, todayIso } from '@/lib/attendance/format';
import type { AttendanceExportFormat, AttendanceHistoryParams } from '@/types/attendance';

const PAGE_SIZE = 25;

const DEFAULT_FILTERS: AttendanceHistoryParams = {
  from: isoDaysAgo(29),
  to: todayIso(),
  limit: PAGE_SIZE,
  offset: 0,
};

function AdminAttendanceHistory() {
  const [filters, setFilters] = useState<AttendanceHistoryParams>(DEFAULT_FILTERS);

  const historyQuery = useAdminAttendanceHistoryQuery(filters);
  const page = historyQuery.data;
  const rows = page?.rows ?? [];

  const pageIndex = Math.floor((filters.offset ?? 0) / PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil((page?.total ?? 0) / PAGE_SIZE));

  // Exports carry the current filters but never the pagination window - the
  // point of an export is the whole filtered set, not the page on screen.
  const exportFilters = useMemo(
    () => ({ ...filters, limit: undefined, offset: undefined }),
    [filters],
  );

  const handleExport = (format: AttendanceExportFormat) =>
    attendanceService.exportHistory(format, exportFilters);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Attendance History</h1>
          <p className="text-[var(--gray-400)]">
            Day-by-day attendance and productivity for every employee
          </p>
        </div>
        <ExportButtons onExport={handleExport} disabled={!rows.length} />
      </div>

      {historyQuery.isError && (
        <div className="flex items-start gap-2 rounded-xl border border-[var(--error)] bg-[var(--error-light)] p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-[var(--error-text)]" />
          <p className="text-xs font-semibold text-[var(--error-text)]">
            Attendance history could not be loaded.
          </p>
        </div>
      )}

      <AttendanceFiltersBar
        value={filters}
        onChange={(next) => setFilters({ ...next, limit: PAGE_SIZE })}
        onReset={() => setFilters(DEFAULT_FILTERS)}
      />

      <p className="text-xs font-semibold text-[var(--gray-400)]">
        {page?.total ?? 0} record{(page?.total ?? 0) === 1 ? '' : 's'} match these filters
      </p>

      <AttendanceHistoryTable
        rows={rows}
        isLoading={historyQuery.isLoading}
        pageSize={PAGE_SIZE}
        manualPagination
        pageCount={pageCount}
        pageIndex={pageIndex}
        onPageChange={(index) => setFilters((prev) => ({ ...prev, offset: index * PAGE_SIZE }))}
      />
    </div>
  );
}

export default function AdminAttendanceHistoryPage() {
  return (
    <AttendanceAccessGate requiredLevel="read">
      <AdminAttendanceHistory />
    </AttendanceAccessGate>
  );
}
