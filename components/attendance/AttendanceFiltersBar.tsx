'use client';

import { RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { AttendanceDayStatus, AttendanceHistoryParams } from '@/types/attendance';

interface AttendanceFiltersBarProps {
  value: AttendanceHistoryParams;
  onChange: (next: AttendanceHistoryParams) => void;
  onReset?: () => void;
  /** Hide the per-employee inputs on the "my history" view. */
  showEmployeeFilters?: boolean;
  className?: string;
}

const FIELD =
  'mt-1 w-full rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none';

const LABEL = 'text-xs font-semibold text-[var(--gray-400)]';

const DAY_STATUSES: AttendanceDayStatus[] = ['present', 'partial', 'absent'];

/**
 * Date range plus the dimension filters the history endpoints accept.
 *
 * Uses native date inputs rather than `components/DateRangePicker.tsx`: that
 * picker is built for leave requests and hard-disables weekends and holidays
 * via `filterDate`, which would make Saturday and Sunday attendance
 * unselectable. Plain date inputs are also what the other admin filter bars in
 * this app use (see `app/admin/work-logs/page.tsx`).
 */
export function AttendanceFiltersBar({
  value,
  onChange,
  onReset,
  showEmployeeFilters = true,
  className = '',
}: AttendanceFiltersBarProps) {
  // Every field clears the pagination offset: keeping it would land the user on
  // a page that no longer exists under the new filter.
  const patch = (updates: Partial<AttendanceHistoryParams>) =>
    onChange({ ...value, ...updates, offset: 0 });

  return (
    <div
      className={`rounded-2xl border border-[var(--gray-100)] bg-[var(--card-bg)] p-4 ${className}`}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div>
          <label className={LABEL} htmlFor="attendance-filter-from">
            From
          </label>
          <input
            id="attendance-filter-from"
            type="date"
            className={FIELD}
            value={value.from ?? ''}
            max={value.to || undefined}
            onChange={(e) => patch({ from: e.target.value || undefined })}
          />
        </div>

        <div>
          <label className={LABEL} htmlFor="attendance-filter-to">
            To
          </label>
          <input
            id="attendance-filter-to"
            type="date"
            className={FIELD}
            value={value.to ?? ''}
            min={value.from || undefined}
            onChange={(e) => patch({ to: e.target.value || undefined })}
          />
        </div>

        {showEmployeeFilters && (
          <>
            <div>
              <label className={LABEL} htmlFor="attendance-filter-employee">
                Employee ID
              </label>
              <input
                id="attendance-filter-employee"
                type="text"
                placeholder="e.g. OXO-0142"
                className={FIELD}
                value={value.employeeId ?? ''}
                onChange={(e) => patch({ employeeId: e.target.value || undefined })}
              />
            </div>

            <div>
              <label className={LABEL} htmlFor="attendance-filter-department">
                Department
              </label>
              <input
                id="attendance-filter-department"
                type="text"
                placeholder="All departments"
                className={FIELD}
                value={value.department ?? ''}
                onChange={(e) => patch({ department: e.target.value || undefined })}
              />
            </div>
          </>
        )}

        <div>
          <label className={LABEL} htmlFor="attendance-filter-status">
            Status
          </label>
          <select
            id="attendance-filter-status"
            className={FIELD}
            value={value.status ?? ''}
            onChange={(e) =>
              patch({ status: (e.target.value || undefined) as AttendanceDayStatus | undefined })
            }
          >
            <option value="">All statuses</option>
            {DAY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {showEmployeeFilters && (
          <div>
            <label className={LABEL} htmlFor="attendance-filter-search">
              Search
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--gray-300)]" />
              <input
                id="attendance-filter-search"
                type="search"
                placeholder="Name, ID or department"
                className={`${FIELD} pl-8`}
                value={value.search ?? ''}
                onChange={(e) => patch({ search: e.target.value || undefined })}
              />
            </div>
          </div>
        )}
      </div>

      {onReset && (
        <div className="mt-3 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            leftIcon={<RotateCcw className="h-3.5 w-3.5" />}
          >
            Reset filters
          </Button>
        </div>
      )}
    </div>
  );
}
