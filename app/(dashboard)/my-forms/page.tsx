'use client';

import Link from 'next/link';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAssignedFormsQuery } from '@/hooks/queries/use-forms-query';

export default function MyFormsPage() {
  const assignedFormsQuery = useAssignedFormsQuery();

  // Only forms that are published and still accepting responses show up here — a form that was
  // unpublished/closed/archived after being distributed shouldn't dangle as fillable.
  const visible = (assignedFormsQuery.data ?? []).filter(
    (a) => a.form.status === 'published' && a.acceptResponses !== false,
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">My Forms</h1>
        <p className="text-[var(--gray-400)]">Forms assigned to you by HR</p>
      </div>

      <div className="space-y-4">
        {assignedFormsQuery.isLoading && <p className="text-sm text-[var(--gray-400)]">Loading forms...</p>}
        {!assignedFormsQuery.isLoading && visible.length === 0 && (
          <p className="text-sm text-[var(--gray-400)]">No forms assigned yet.</p>
        )}
        {visible.map(({ form, submitted, closeAt }) => {
          const effectiveCloseAt = closeAt || form.closeAt;
          const deadlinePassed = effectiveCloseAt && new Date() > new Date(effectiveCloseAt);

          let statusBadge = null;
          if (submitted) {
            statusBadge = (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3" /> Submitted
              </span>
            );
          } else if (deadlinePassed) {
            statusBadge = (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                <AlertCircle className="h-3 w-3" /> Overdue (Pending)
              </span>
            );
          } else if (effectiveCloseAt) {
            statusBadge = (
              <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                <Clock className="h-3 w-3" /> Pending
              </span>
            );
          }

          return (
            <div
              key={form.id}
              className={`flex items-center justify-between rounded-2xl border bg-[var(--card-bg)] p-5 transition-all ${
                !submitted && deadlinePassed
                  ? 'border-amber-200 dark:border-amber-900/60'
                  : !submitted && effectiveCloseAt
                  ? 'border-blue-200 dark:border-blue-900/60'
                  : 'border-[var(--gray-100)]'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-bold text-[var(--foreground)]">{form.title}</h3>
                  {statusBadge}
                </div>
                {form.description && <p className="text-xs text-[var(--gray-400)]">{form.description}</p>}
                {effectiveCloseAt && (
                  <p className={`text-xs font-medium flex items-center gap-1 mt-1 ${deadlinePassed && !submitted ? 'text-amber-600 dark:text-amber-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    <Clock className="h-3.5 w-3.5" />
                    Deadline: {new Date(effectiveCloseAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                )}
              </div>
              <div>
                {submitted ? (
                  <Link href={`/my-forms/${form.id}`} className="text-xs font-semibold text-emerald-600 hover:underline">
                    Submitted — view / edit
                  </Link>
                ) : (
                  <Link
                    href={`/my-forms/${form.id}`}
                    className={`inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all ${
                      deadlinePassed ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[var(--primary)] hover:opacity-90'
                    }`}
                  >
                    {deadlinePassed ? 'Fill Out (Late)' : 'Fill Out'}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
