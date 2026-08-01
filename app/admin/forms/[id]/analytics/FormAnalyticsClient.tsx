'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFormAnalyticsQuery, useFormQuery } from '@/hooks/queries/use-forms-query';
import { Card } from '@/components/ui';

const formatDuration = (ms: number): string => {
  if (!ms || ms <= 0) return '—';
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
};

const formatPercent = (ratio: number): string => `${Math.round(ratio * 100)}%`;

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Card padding="md">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--gray-400)]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[var(--foreground)]">{value}</p>
    </Card>
  );
}

function DistributionBars({ items }: { items: { label: string; count: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="w-32 shrink-0 truncate text-xs text-[var(--gray-400)]" title={item.label}>
            {item.label}
          </span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-[var(--gray-50)]">
            <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${(item.count / max) * 100}%` }} />
          </div>
          <span className="w-8 shrink-0 text-right text-xs font-semibold text-[var(--foreground)]">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

function TrendChart({ trend }: { trend: { date: string; count: number }[] }) {
  const max = Math.max(1, ...trend.map((t) => t.count));
  return (
    <div className="flex h-32 items-end gap-1.5">
      {trend.map((t) => (
        <div key={t.date} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-[var(--primary)]"
            style={{ height: `${Math.max(2, (t.count / max) * 100)}%` }}
            title={`${t.date}: ${t.count}`}
          />
          <span className="text-[9px] text-[var(--gray-300)]">{t.date.slice(5)}</span>
        </div>
      ))}
    </div>
  );
}

export default function FormAnalyticsClient() {
  const params = useParams<{ id: string }>();
  const formId = Number(params.id);
  const { isHR, isSuperAdmin } = useAuth();

  const formQuery = useFormQuery(formId);
  const analyticsQuery = useFormAnalyticsQuery(formId);

  if (!isHR && !isSuperAdmin) {
    return <p className="text-sm text-[var(--gray-400)]">You do not have access to this page.</p>;
  }

  if (analyticsQuery.isLoading || !analyticsQuery.data) {
    return (
      <div className="flex items-center justify-center py-24 text-[var(--gray-400)]">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const analytics = analyticsQuery.data;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Link href={`/admin/forms/${formId}/edit`} className="flex items-center gap-1.5 text-sm font-semibold text-[var(--gray-400)] hover:text-[var(--foreground)]">
          <ArrowLeft className="h-4 w-4" /> Back to builder
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-[var(--foreground)]">Analytics</h1>
        <p className="text-[var(--gray-400)]">{formQuery.data?.form.title}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Responses" value={String(analytics.totalResponses)} />
        <StatTile label="Started" value={String(analytics.totalStarted)} />
        <StatTile label="Completion rate" value={formatPercent(analytics.completionRate)} />
        <StatTile label="Avg. completion time" value={formatDuration(analytics.avgCompletionMs)} />
      </div>

      {analytics.trend.length > 0 && (
        <Card>
          <h3 className="mb-4 text-sm font-bold text-[var(--foreground)]">Submissions over time</h3>
          <TrendChart trend={analytics.trend} />
        </Card>
      )}

      {analytics.perQuestion.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[var(--foreground)]">Per-question breakdown</h3>
          {analytics.perQuestion.map((q) => (
            <Card key={q.questionId}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-[var(--foreground)]">{q.title || 'Untitled question'}</p>
                <span className="text-xs text-[var(--gray-400)]">{q.responseCount} response(s)</span>
              </div>
              {q.distribution && q.distribution.length > 0 ? (
                <DistributionBars items={q.distribution} />
              ) : typeof q.average === 'number' ? (
                <p className="text-2xl font-bold text-[var(--foreground)]">{q.average.toFixed(1)} avg</p>
              ) : (
                <p className="text-xs text-[var(--gray-400)]">No distribution available for this question type.</p>
              )}
            </Card>
          ))}
        </div>
      )}

      {analytics.totalResponses === 0 && (
        <p className="text-sm text-[var(--gray-400)]">No responses yet — analytics will populate once employees start submitting.</p>
      )}
    </div>
  );
}
