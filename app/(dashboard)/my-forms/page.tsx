'use client';

import Link from 'next/link';
import { useAssignedFormsQuery } from '@/hooks/queries/use-forms-query';

export default function MyFormsPage() {
  const assignedFormsQuery = useAssignedFormsQuery();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">My Forms</h1>
        <p className="text-[var(--gray-400)]">Forms assigned to you by HR</p>
      </div>

      <div className="space-y-3">
        {assignedFormsQuery.isLoading && <p className="text-sm text-[var(--gray-400)]">Loading...</p>}
        {assignedFormsQuery.data?.length === 0 && <p className="text-sm text-[var(--gray-400)]">No forms assigned yet.</p>}
        {assignedFormsQuery.data?.map(({ form, submitted }) => (
          <div key={form.id} className="flex items-center justify-between rounded-2xl border border-[var(--gray-100)] p-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)]">{form.title}</h3>
              {form.description && <p className="text-xs text-[var(--gray-400)]">{form.description}</p>}
            </div>
            {submitted ? (
              <span className="text-xs font-semibold text-emerald-600">Submitted</span>
            ) : (
              <Link href={`/my-forms/${form.id}`} className="text-sm font-semibold text-[var(--primary)] hover:underline">
                Fill Out
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
