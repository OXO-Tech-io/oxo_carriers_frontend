'use client';

import { Briefcase, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import type { EmployeeWorkHistory } from '@/types/profile';

function formatRange(startDate: string, endDate: string | null) {
  const start = (() => {
    try {
      return format(new Date(startDate), 'MMM yyyy');
    } catch {
      return startDate;
    }
  })();
  if (!endDate) return `${start} – Present`;
  const end = (() => {
    try {
      return format(new Date(endDate), 'MMM yyyy');
    } catch {
      return endDate;
    }
  })();
  return `${start} – ${end}`;
}

interface WorkHistoryTimelineProps {
  entries: EmployeeWorkHistory[];
  onEdit?: (entry: EmployeeWorkHistory) => void;
  onDelete?: (entry: EmployeeWorkHistory) => void;
}

export function WorkHistoryTimeline({ entries, onEdit, onDelete }: WorkHistoryTimelineProps) {
  const sorted = [...entries].sort((a, b) => (a.startDate < b.startDate ? 1 : -1));

  return (
    <div className="relative">
      {sorted.map((entry, idx) => {
        const isLast = idx === sorted.length - 1;
        return (
          <div key={entry.id} className="relative flex gap-4 pb-8 last:pb-0">
            {/* Rail */}
            <div className="flex flex-col items-center">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-sm">
                <Briefcase className="h-4 w-4" />
              </div>
              {!isLast && <div className="w-px flex-1 bg-[var(--gray-100)] mt-1" />}
            </div>

            {/* Content */}
            <div className="flex-1 pt-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                    {entry.positionHeld}
                    {entry.employmentType !== 'regular' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[var(--primary-light)] text-[var(--primary)]">
                        {entry.employmentType}
                      </span>
                    )}
                  </p>
                  <p className="text-xs font-semibold text-[var(--primary)] mt-0.5">{entry.organization}</p>
                  <p className="text-[11px] font-medium text-[var(--gray-400)] mt-1">
                    {formatRange(entry.startDate, entry.endDate)}
                  </p>
                  {entry.remarks && (
                    <p className="text-xs text-[var(--gray-500)] mt-2 leading-relaxed">{entry.remarks}</p>
                  )}
                </div>
                {(onEdit || onDelete) && (
                  <div className="flex items-center gap-1 shrink-0">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(entry)}
                        className="p-1.5 rounded-lg text-[var(--gray-400)] hover:text-[var(--primary)] hover:bg-[var(--gray-50)] transition-colors"
                        aria-label="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(entry)}
                        className="p-1.5 rounded-lg text-[var(--gray-400)] hover:text-red-500 hover:bg-[var(--gray-50)] transition-colors"
                        aria-label="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
