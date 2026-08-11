'use client';

import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import type { AttendanceReport, AttendanceReportRow } from '@/types/attendance';

interface AttendanceReportTableProps {
  report: AttendanceReport | undefined;
  isLoading?: boolean;
  className?: string;
}

const renderCell = (value: AttendanceReportRow[string]) => {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
};

/**
 * Renders any of the nine attendance reports. All of them share one envelope -
 * `columns` + `rows` + `totals` - so this iterates the column spec and never
 * needs per-report knowledge, exactly as the export service does server-side.
 */
export function AttendanceReportTable({
  report,
  isLoading = false,
  className = '',
}: AttendanceReportTableProps) {
  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!report) return null;

  if (!report.rows.length) {
    return (
      <EmptyState
        title="No data for this report"
        description="Nothing was tracked for the selected period and filters."
      />
    );
  }

  const totalKeys = Object.keys(report.totals ?? {});
  const hasTotals = totalKeys.length > 0;

  return (
    <div className={`overflow-x-auto rounded-2xl border border-[var(--gray-100)] ${className}`}>
      <table className="min-w-full divide-y divide-[var(--gray-100)]">
        <thead className="bg-[var(--gray-25)]">
          <tr>
            {report.columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className="px-6 py-3.5 text-left text-xs font-bold uppercase tracking-wider text-[var(--gray-400)] whitespace-nowrap"
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--gray-100)] bg-[var(--card-bg)]">
          {report.rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {report.columns.map((column) => (
                <td
                  key={column.key}
                  className="px-6 py-4 text-sm text-[var(--foreground)] whitespace-nowrap"
                >
                  {renderCell(row[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {hasTotals && (
          <tfoot className="bg-[var(--gray-25)]">
            <tr>
              {report.columns.map((column, index) => (
                <td
                  key={column.key}
                  className="px-6 py-3.5 text-sm font-bold text-[var(--foreground)] whitespace-nowrap"
                >
                  {index === 0 && !(column.key in report.totals)
                    ? 'Totals'
                    : renderCell(report.totals[column.key])}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
