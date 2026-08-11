'use client';

import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { AlertTriangle, PlugZap } from 'lucide-react';
import { DataTable } from '@/components/ui/DataTable';
import {
  formatDateOnly,
  formatDurationShort,
  formatPercent,
  formatTimeOnly,
} from '@/lib/attendance/format';
import type { AttendanceDayStatus, AttendanceHistoryRow } from '@/types/attendance';

interface AttendanceHistoryTableProps {
  rows: AttendanceHistoryRow[];
  isLoading?: boolean;
  /** Drop the employee columns on the "my history" view. */
  showEmployee?: boolean;
  pageSize?: number;
  manualPagination?: boolean;
  pageCount?: number;
  pageIndex?: number;
  onPageChange?: (index: number) => void;
}

const STATUS_TONE: Record<AttendanceDayStatus, { bg: string; text: string }> = {
  present: { bg: 'var(--success-light)', text: 'var(--success-text)' },
  partial: { bg: 'var(--warning-light)', text: 'var(--warning-text)' },
  absent: { bg: 'var(--gray-50)', text: 'var(--gray-500)' },
};

function DayStatusPill({ status }: { status: AttendanceDayStatus }) {
  const tone = STATUS_TONE[status] ?? STATUS_TONE.absent;
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold capitalize"
      style={{ backgroundColor: tone.bg, color: tone.text }}
    >
      {status}
    </span>
  );
}

/** Daily-summary table, shared by the employee and admin history pages. */
export function AttendanceHistoryTable({
  rows,
  isLoading = false,
  showEmployee = true,
  pageSize = 10,
  manualPagination = false,
  pageCount,
  pageIndex,
  onPageChange,
}: AttendanceHistoryTableProps) {
  const columns = useMemo<ColumnDef<AttendanceHistoryRow, unknown>[]>(() => {
    const employeeColumns: ColumnDef<AttendanceHistoryRow, unknown>[] = showEmployee
      ? [
          { accessorKey: 'name', header: 'Employee' },
          {
            accessorKey: 'department',
            header: 'Department',
            cell: ({ row }) => row.original.department ?? '—',
          },
        ]
      : [];

    return [
      {
        accessorKey: 'summaryDate',
        header: 'Date',
        cell: ({ row }) => formatDateOnly(row.original.summaryDate),
      },
      ...employeeColumns,
      {
        accessorKey: 'firstLoginAt',
        header: 'First Login',
        cell: ({ row }) => formatTimeOnly(row.original.firstLoginAt),
      },
      {
        accessorKey: 'lastLogoutAt',
        header: 'Last Logout',
        cell: ({ row }) => formatTimeOnly(row.original.lastLogoutAt),
      },
      {
        accessorKey: 'totalLoggedSec',
        header: 'Logged',
        cell: ({ row }) => formatDurationShort(row.original.totalLoggedSec),
      },
      {
        accessorKey: 'activeSec',
        header: 'Active',
        cell: ({ row }) => formatDurationShort(row.original.activeSec),
      },
      {
        accessorKey: 'idleSec',
        header: 'Idle',
        cell: ({ row }) => formatDurationShort(row.original.idleSec),
      },
      {
        accessorKey: 'efficiencyPct',
        header: 'Efficiency',
        cell: ({ row }) => (
          <span className="font-semibold tabular-nums">
            {formatPercent(row.original.efficiencyPct)}
          </span>
        ),
      },
      {
        accessorKey: 'sessionCount',
        header: 'Sessions',
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <DayStatusPill status={row.original.status} />,
      },
      {
        id: 'flags',
        header: 'Flags',
        cell: ({ row }) => {
          const flags: string[] = [];
          if (row.original.isLate) flags.push('Late login');
          if (row.original.isEarlyLogout) flags.push('Early logout');
          if (!flags.length && !row.original.hadAbnormalLogout) {
            return <span className="text-xs text-[var(--gray-400)]">—</span>;
          }
          return (
            <div className="flex flex-wrap items-center gap-1.5">
              {flags.map((flag) => (
                <span
                  key={flag}
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{
                    backgroundColor: 'var(--warning-light)',
                    color: 'var(--warning-text)',
                  }}
                >
                  <AlertTriangle className="h-3 w-3" />
                  {flag}
                </span>
              ))}
              {row.original.hadAbnormalLogout && (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ backgroundColor: 'var(--error-light)', color: 'var(--error-text)' }}
                  title="A session ended without a clean logout — the browser was closed or the machine went to sleep."
                >
                  <PlugZap className="h-3 w-3" />
                  Abnormal logout
                </span>
              )}
            </div>
          );
        },
      },
    ];
  }, [showEmployee]);

  return (
    <DataTable
      columns={columns}
      data={rows}
      isLoading={isLoading}
      pageSize={pageSize}
      manualPagination={manualPagination}
      pageCount={pageCount}
      pageIndex={pageIndex}
      onPageChange={onPageChange}
      emptyTitle="No attendance records"
      emptyDescription="Nothing was tracked for the selected filters."
    />
  );
}
