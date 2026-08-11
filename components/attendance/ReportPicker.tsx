'use client';

import type { AttendanceReportParams, AttendanceReportType } from '@/types/attendance';

/** Which date inputs a report actually reads — the rest are ignored server-side. */
type RangeKind = 'date' | 'week' | 'month' | 'range';

export const REPORT_TYPES: Array<{
  type: AttendanceReportType;
  label: string;
  description: string;
  range: RangeKind;
}> = [
  { type: 'daily', label: 'Daily Attendance', description: 'One day, every tracked employee.', range: 'date' },
  { type: 'weekly', label: 'Weekly Attendance', description: 'A full ISO week per employee.', range: 'week' },
  { type: 'monthly', label: 'Monthly Attendance', description: 'A calendar month per employee.', range: 'month' },
  { type: 'productivity', label: 'Productivity', description: 'Active vs logged time by employee.', range: 'range' },
  {
    type: 'department-productivity',
    label: 'Department Productivity',
    description: 'The same measure rolled up per department.',
    range: 'range',
  },
  { type: 'idle-time', label: 'Idle Time', description: 'Where the idle hours went.', range: 'range' },
  { type: 'late-login', label: 'Late Logins', description: 'Sign-ins after the configured cut-off.', range: 'range' },
  { type: 'early-logout', label: 'Early Logouts', description: 'Sign-offs before the configured cut-off.', range: 'range' },
  {
    type: 'online-duration',
    label: 'Online Duration',
    description: 'Total time signed in per employee.',
    range: 'range',
  },
];

const RANGE_BY_TYPE = new Map(REPORT_TYPES.map((entry) => [entry.type, entry.range]));

export const rangeKindFor = (type: AttendanceReportType): RangeKind =>
  RANGE_BY_TYPE.get(type) ?? 'range';

/**
 * Strip the params the selected report does not read, so switching report type
 * cannot silently carry a stale `weekStart` into a monthly run.
 */
export function paramsForReport(
  type: AttendanceReportType,
  params: AttendanceReportParams,
): AttendanceReportParams {
  const shared: AttendanceReportParams = {
    employeeId: params.employeeId || undefined,
    department: params.department || undefined,
  };

  switch (rangeKindFor(type)) {
    case 'date':
      return { ...shared, date: params.date || undefined };
    case 'week':
      return { ...shared, weekStart: params.weekStart || undefined };
    case 'month':
      return { ...shared, year: params.year, month: params.month };
    default:
      return { ...shared, from: params.from || undefined, to: params.to || undefined };
  }
}

interface ReportPickerProps {
  type: AttendanceReportType;
  onTypeChange: (type: AttendanceReportType) => void;
  params: AttendanceReportParams;
  onParamsChange: (params: AttendanceReportParams) => void;
  className?: string;
}

const FIELD =
  'mt-1 w-full rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none';

const LABEL = 'text-xs font-semibold text-[var(--gray-400)]';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** Report type selector plus only the parameters that report understands. */
export function ReportPicker({
  type,
  onTypeChange,
  params,
  onParamsChange,
  className = '',
}: ReportPickerProps) {
  const kind = rangeKindFor(type);
  const selected = REPORT_TYPES.find((entry) => entry.type === type);
  const patch = (updates: Partial<AttendanceReportParams>) =>
    onParamsChange({ ...params, ...updates });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, index) => currentYear - index);

  return (
    <div
      className={`rounded-2xl border border-[var(--gray-100)] bg-[var(--card-bg)] p-4 ${className}`}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <label className={LABEL} htmlFor="attendance-report-type">
            Report
          </label>
          <select
            id="attendance-report-type"
            className={FIELD}
            value={type}
            onChange={(e) => onTypeChange(e.target.value as AttendanceReportType)}
          >
            {REPORT_TYPES.map((entry) => (
              <option key={entry.type} value={entry.type}>
                {entry.label}
              </option>
            ))}
          </select>
        </div>

        {kind === 'date' && (
          <div>
            <label className={LABEL} htmlFor="attendance-report-date">
              Date
            </label>
            <input
              id="attendance-report-date"
              type="date"
              className={FIELD}
              value={params.date ?? ''}
              onChange={(e) => patch({ date: e.target.value || undefined })}
            />
          </div>
        )}

        {kind === 'week' && (
          <div>
            <label className={LABEL} htmlFor="attendance-report-week">
              Any day in the week
            </label>
            <input
              id="attendance-report-week"
              type="date"
              className={FIELD}
              value={params.weekStart ?? ''}
              onChange={(e) => patch({ weekStart: e.target.value || undefined })}
            />
          </div>
        )}

        {kind === 'month' && (
          <>
            <div>
              <label className={LABEL} htmlFor="attendance-report-year">
                Year
              </label>
              <select
                id="attendance-report-year"
                className={FIELD}
                value={params.year ?? currentYear}
                onChange={(e) => patch({ year: Number(e.target.value) })}
              >
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={LABEL} htmlFor="attendance-report-month">
                Month
              </label>
              <select
                id="attendance-report-month"
                className={FIELD}
                value={params.month ?? new Date().getMonth() + 1}
                onChange={(e) => patch({ month: Number(e.target.value) })}
              >
                {MONTHS.map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {kind === 'range' && (
          <>
            <div>
              <label className={LABEL} htmlFor="attendance-report-from">
                From
              </label>
              <input
                id="attendance-report-from"
                type="date"
                className={FIELD}
                value={params.from ?? ''}
                max={params.to || undefined}
                onChange={(e) => patch({ from: e.target.value || undefined })}
              />
            </div>
            <div>
              <label className={LABEL} htmlFor="attendance-report-to">
                To
              </label>
              <input
                id="attendance-report-to"
                type="date"
                className={FIELD}
                value={params.to ?? ''}
                min={params.from || undefined}
                onChange={(e) => patch({ to: e.target.value || undefined })}
              />
            </div>
          </>
        )}

        <div>
          <label className={LABEL} htmlFor="attendance-report-employee">
            Employee ID
          </label>
          <input
            id="attendance-report-employee"
            type="text"
            placeholder="All employees"
            className={FIELD}
            value={params.employeeId ?? ''}
            onChange={(e) => patch({ employeeId: e.target.value || undefined })}
          />
        </div>

        <div>
          <label className={LABEL} htmlFor="attendance-report-department">
            Department
          </label>
          <input
            id="attendance-report-department"
            type="text"
            placeholder="All departments"
            className={FIELD}
            value={params.department ?? ''}
            onChange={(e) => patch({ department: e.target.value || undefined })}
          />
        </div>
      </div>

      {selected && (
        <p className="mt-3 text-xs text-[var(--gray-400)]">{selected.description}</p>
      )}
    </div>
  );
}
