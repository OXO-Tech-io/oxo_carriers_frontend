'use client';

import { AlertCircle, Clock } from 'lucide-react';
import { Modal } from '@/components/ui';
import { useAllWorkLogsQuery } from '@/hooks/queries/use-work-logs-query';

interface WorkLogDayBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Numeric employee id - the same `userId` a work-log summary row carries. */
  userId: number | null;
  employeeName: string;
  date: string;
}

/** Replaces the old "Detailed" tab - the same per-entry data, scoped to one
 *  employee's one day and reached by clicking their row in the summary table. */
export function WorkLogDayBreakdownModal({ isOpen, onClose, userId, employeeName, date }: WorkLogDayBreakdownModalProps) {
  const entriesQuery = useAllWorkLogsQuery(
    { userId: userId ?? undefined, from: date, to: date },
    { enabled: isOpen && userId != null },
  );

  const entries = entriesQuery.data ?? [];
  const totalHours = entries.reduce((sum, entry) => sum + Number(entry.hoursSpent), 0);
  const taskCount = entries.length;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${employeeName} — ${new Date(date).toLocaleDateString()}`} size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-[var(--gray-100)] bg-[var(--gray-25)] p-4">
            <p className="text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Hours Spent</p>
            <p className="mt-1 text-2xl font-extrabold text-[var(--foreground)]">{totalHours}</p>
          </div>
          <div className="rounded-xl border border-[var(--gray-100)] bg-[var(--gray-25)] p-4">
            <p className="text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Tasks Logged</p>
            <p className="mt-1 text-2xl font-extrabold text-[var(--foreground)]">{taskCount}</p>
          </div>
        </div>

        {entriesQuery.isLoading && <p className="text-sm text-[var(--gray-400)]">Loading entries...</p>}

        {!entriesQuery.isLoading && entries.length === 0 && (
          <p className="text-sm text-[var(--gray-400)]">No entries for this day.</p>
        )}

        <ul className="space-y-3">
          {entries.map((entry) => (
            <li key={entry.id} className="rounded-xl border border-[var(--gray-100)] p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--foreground)]">{entry.taskDescription}</p>
                <span className="shrink-0 text-sm font-bold text-[var(--primary)]">{entry.hoursSpent}h</span>
              </div>
              {entry.remarks && <p className="mt-1 text-xs text-[var(--gray-400)]">{entry.remarks}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[var(--gray-400)]">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Submitted {new Date(entry.createdAt).toLocaleString()}
                </span>
                {entry.isLate ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 font-semibold text-amber-700">
                    <AlertCircle className="h-3 w-3" />
                    Late submission
                  </span>
                ) : (
                  entry.deadlineAt && (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 font-semibold text-green-700">
                      On time
                    </span>
                  )
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}
