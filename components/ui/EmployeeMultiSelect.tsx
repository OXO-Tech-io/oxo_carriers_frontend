'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { userDirectoryService } from '@/lib/services/user-directory.service';
import type { EmployeeSummary } from '@/types/hrModules';

interface EmployeeMultiSelectProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  maxHeightClassName?: string;
  /** Employees who should be shown but not selectable (e.g. already received this send/form),
   * labeled "Already sent" instead of silently disappearing from the list. */
  disabledIds?: number[];
  /** Employees to leave out of the list entirely (e.g. already members of the group being
   * managed) - OCD-520. Unlike `disabledIds`, these don't render at all, grayed-out or not. */
  excludeIds?: number[];
}

// Checkbox list + search, backed by GET /users. Shared by Communications
// (recipients) and Forms (distribution) - no off-the-shelf multi-select
// component exists in this codebase (see components/ui/index.ts).
export function EmployeeMultiSelect({
  selectedIds,
  onChange,
  maxHeightClassName = 'max-h-64',
  disabledIds = [],
  excludeIds = [],
}: EmployeeMultiSelectProps) {
  const disabledSet = new Set(disabledIds);
  const excludeSet = new Set(excludeIds);
  const [search, setSearch] = useState('');
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    userDirectoryService
      .list({ search: search || undefined })
      .then((data) => {
        if (active) setEmployees(data);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [search]);

  const toggle = (id: number) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((existing) => existing !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const visibleEmployees = employees.filter((employee) => !excludeSet.has(employee.id));

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--gray-400)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search employees by name or email..."
          className="w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] pl-9 pr-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-ring)]"
        />
      </div>

      <div className={`space-y-1 overflow-y-auto rounded-xl border border-[var(--gray-100)] p-2 ${maxHeightClassName}`}>
        {isLoading && <p className="text-xs text-[var(--gray-400)] px-2 py-1">Loading...</p>}
        {!isLoading && visibleEmployees.length === 0 && (
          <p className="text-xs text-[var(--gray-400)] px-2 py-1">No employees found</p>
        )}
        {visibleEmployees.map((employee) => {
          const alreadySent = disabledSet.has(employee.id);
          return (
            <label
              key={employee.id}
              className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${
                alreadySent ? 'cursor-not-allowed opacity-50' : 'hover:bg-[var(--gray-25)] cursor-pointer'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(employee.id)}
                disabled={alreadySent}
                onChange={() => toggle(employee.id)}
                className="h-4 w-4 rounded border-[var(--gray-300)] text-[var(--primary)] focus:ring-[var(--primary-ring)]"
              />
              <span className="text-sm text-[var(--foreground)]">
                {employee.first_name} {employee.last_name}
                <span className="text-[var(--gray-400)]"> · {employee.email}</span>
                {alreadySent && <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">Already sent</span>}
              </span>
            </label>
          );
        })}
      </div>

      {selectedIds.length > 0 && (
        <p className="text-xs font-medium text-[var(--primary)]">{selectedIds.length} employee(s) selected</p>
      )}
    </div>
  );
}
