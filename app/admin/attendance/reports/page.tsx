'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { AttendanceBarChart, type BarDatum } from '@/components/attendance/AttendanceBarChart';
import { AttendanceReportTable } from '@/components/attendance/AttendanceReportTable';
import { ExportButtons } from '@/components/attendance/ExportButtons';
import { ReportPicker, paramsForReport } from '@/components/attendance/ReportPicker';
import { useAttendanceReportQuery } from '@/hooks/queries/use-attendance-query';
import { attendanceService } from '@/lib/services/attendance.service';
import { isoDaysAgo, todayIso } from '@/lib/attendance/format';
import type {
  AttendanceExportFormat,
  AttendanceReport,
  AttendanceReportParams,
  AttendanceReportType,
} from '@/types/attendance';

const MAX_CHART_ROWS = 12;

/**
 * Every report shares one envelope, so the chart is derived generically: the
 * first column whose values are numeric becomes the measure, and the first
 * non-numeric column becomes the category. The table is the primary view - this
 * is a secondary read of the same rows, not a second source of truth.
 */
function deriveChartData(report: AttendanceReport | undefined): {
  data: BarDatum[];
  measure: string;
} {
  if (!report?.rows.length) return { data: [], measure: '' };

  const isNumeric = (key: string) =>
    report.rows.some((row) => typeof row[key] === 'number' && Number.isFinite(row[key] as number));

  const measureColumn = report.columns.find((column) => isNumeric(column.key));
  const labelColumn = report.columns.find(
    (column) => column.key !== measureColumn?.key && !isNumeric(column.key),
  );

  if (!measureColumn) return { data: [], measure: '' };

  const data = report.rows
    .map((row, index) => ({
      label: labelColumn ? String(row[labelColumn.key] ?? `Row ${index + 1}`) : `Row ${index + 1}`,
      value: typeof row[measureColumn.key] === 'number' ? (row[measureColumn.key] as number) : 0,
    }))
    .filter((datum) => datum.value !== 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, MAX_CHART_ROWS);

  return { data, measure: measureColumn.header };
}

export default function AttendanceReportsPage() {
  const [type, setType] = useState<AttendanceReportType>('daily');
  const [draft, setDraft] = useState<AttendanceReportParams>({
    date: todayIso(),
    weekStart: todayIso(),
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    from: isoDaysAgo(29),
    to: todayIso(),
  });

  // Only the params this report understands reach the API, so switching type
  // cannot carry a stale `weekStart` into a monthly run.
  const params = useMemo(() => paramsForReport(type, draft), [type, draft]);

  const reportQuery = useAttendanceReportQuery(type, params);
  const report = reportQuery.data;
  const { data: chartData, measure } = useMemo(() => deriveChartData(report), [report]);

  const isForbidden =
    (reportQuery.error as { response?: { status?: number } } | null)?.response?.status === 403;

  const handleExport = (format: AttendanceExportFormat) =>
    attendanceService.exportReport(type, format, params);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Attendance Reports</h1>
          <p className="text-[var(--gray-400)]">
            {report?.title ?? 'Attendance, productivity and exception reporting'}
          </p>
        </div>
        <ExportButtons onExport={handleExport} disabled={!report?.rows.length} />
      </div>

      <ReportPicker type={type} onTypeChange={setType} params={draft} onParamsChange={setDraft} />

      {isForbidden && (
        <div className="flex items-start gap-2 rounded-xl border border-[var(--error)] bg-[var(--error-light)] p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-[var(--error-text)]" />
          <p className="text-xs font-semibold text-[var(--error-text)]">
            Attendance reports are limited to HR Managers and HR Executives.
          </p>
        </div>
      )}

      {reportQuery.isError && !isForbidden && (
        <div className="flex items-start gap-2 rounded-xl border border-[var(--error)] bg-[var(--error-light)] p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 text-[var(--error-text)]" />
          <p className="text-xs font-semibold text-[var(--error-text)]">
            This report could not be generated. Check the selected period and try again.
          </p>
        </div>
      )}

      {!reportQuery.isError && chartData.length > 0 && (
        <Card padding="md">
          <CardHeader
            title={measure}
            subtitle={`Top ${chartData.length} of ${report?.rows.length ?? 0} rows`}
          />
          <AttendanceBarChart
            data={chartData}
            valueLabel={measure}
            height={Math.max(200, chartData.length * 28 + 40)}
          />
        </Card>
      )}

      {!reportQuery.isError && (
        <AttendanceReportTable report={report} isLoading={reportQuery.isLoading} />
      )}
    </div>
  );
}
