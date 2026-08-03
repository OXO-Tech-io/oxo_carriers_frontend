'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, Clock, Download, Hourglass, AlertTriangle, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  useWorkLogDailyStatusQuery,
  useWorkLogDeadlineQuery,
  useWorkLogSummaryQuery,
} from '@/hooks/queries/use-work-logs-query';
import { useUpdateWorkLogDeadlineMutation } from '@/hooks/mutations/use-work-log-mutations';
import { workLogService } from '@/lib/services/work-log.service';
import { Button, Card, DataTable } from '@/components/ui';
import { WorkLogDayBreakdownModal } from '@/components/modals/WorkLogDayBreakdownModal';
import type { WorkLogUserSummary } from '@/types/hrModules';

const todayIso = () => new Date().toISOString().slice(0, 10);

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function StatCard({
  label,
  value,
  icon: Icon,
  accentColor,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}) {
  return (
    <Card padding="md" className="relative overflow-hidden">
      <div className="absolute top-0 left-0 h-1.5 w-full" style={{ backgroundColor: accentColor }} />
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">{label}</p>
          <p className="text-3xl font-extrabold text-[var(--foreground)] tracking-tight">{value}</p>
        </div>
        <div
          className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-md shrink-0"
          style={{ backgroundColor: accentColor }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

export default function AdminWorkLogsPage() {
  const { isHRManager, isSuperAdmin } = useAuth();
  // Defaults to today - HR picks an earlier date to check past submissions.
  const [date, setDate] = useState(todayIso());
  const [isExporting, setIsExporting] = useState(false);
  const [breakdown, setBreakdown] = useState<{ userId: number; employeeName: string } | null>(null);

  const params = { from: date, to: date };
  const summaryQuery = useWorkLogSummaryQuery(params);
  const dailyStatusQuery = useWorkLogDailyStatusQuery(date);

  const deadlineQuery = useWorkLogDeadlineQuery();
  const updateDeadline = useUpdateWorkLogDeadlineMutation();
  // null = untouched, so the card shows the saved server value. Clearing it
  // after a save re-derives from the refreshed query instead of an effect.
  const [deadlineEdit, setDeadlineEdit] = useState<{ isEnabled: boolean; deadlineTime: string } | null>(null);
  const [deadlineSaved, setDeadlineSaved] = useState(false);

  if (!isHRManager && !isSuperAdmin) {
    return <p className="text-sm text-[var(--gray-400)]">You do not have access to this page.</p>;
  }

  const savedDeadline = {
    isEnabled: deadlineQuery.data?.isEnabled ?? false,
    deadlineTime: deadlineQuery.data?.deadlineTime ?? '18:00',
  };
  const deadlineDraft = deadlineEdit ?? savedDeadline;
  const canEditDeadline = deadlineQuery.data?.canEdit ?? false;
  const deadlineDirty =
    deadlineDraft.isEnabled !== savedDeadline.isEnabled ||
    deadlineDraft.deadlineTime !== savedDeadline.deadlineTime;

  const patchDeadlineDraft = (patch: Partial<typeof savedDeadline>) =>
    setDeadlineEdit({ ...deadlineDraft, ...patch });

  const handleSaveDeadline = async () => {
    setDeadlineSaved(false);
    await updateDeadline.mutateAsync(deadlineDraft);
    setDeadlineEdit(null);
    setDeadlineSaved(true);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await workLogService.downloadSummaryReport(params);
      downloadBlob(blob, `work-logs-summary-${date}.xlsx`);
    } finally {
      setIsExporting(false);
    }
  };

  const summaryColumns: ColumnDef<WorkLogUserSummary, any>[] = [
    { accessorKey: 'employeeId', header: 'Employee ID', cell: ({ row }) => row.original.employeeId || 'N/A' },
    {
      header: 'Employee Name',
      cell: ({ row }) => `${row.original.firstName} ${row.original.lastName}`,
    },
    { accessorKey: 'totalHours', header: 'Total Hours' },
    { accessorKey: 'entryCount', header: 'Entries' },
    {
      accessorKey: 'lateCount',
      header: 'Late',
      cell: ({ row }) =>
        row.original.lateCount > 0 ? (
          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
            {row.original.lateCount} late
          </span>
        ) : (
          <span className="text-xs text-[var(--gray-400)]">—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">All Work Logs</h1>
          <p className="text-[var(--gray-400)]">Review employee daily work log submissions</p>
        </div>
        <Button onClick={handleExport} isLoading={isExporting} leftIcon={<Download className="h-3.5 w-3.5" />}>
          Export Summary Excel
        </Button>
      </div>

      {/* Submission deadline - org-wide daily cut-off. Weekends and any date on
          the leave calendar are exempt automatically. */}
      <div className="bg-[var(--card-bg)] border border-[var(--gray-100)] rounded-2xl shadow-sm p-5 space-y-4">
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 mt-0.5 text-[var(--primary)]" />
          <div>
            <h2 className="text-sm font-bold text-[var(--foreground)]">Submission Deadline</h2>
            <p className="text-xs text-[var(--gray-400)] mt-0.5">
              Applies Monday to Friday only. Saturdays, Sundays, and any holiday added in{' '}
              <span className="font-semibold">Leave Calendar</span> are exempt. Work logs submitted after
              the deadline are still accepted — they are marked as late submissions.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={deadlineDraft.isEnabled}
              disabled={!canEditDeadline}
              onChange={(e) => patchDeadlineDraft({ isEnabled: e.target.checked })}
              className="h-4 w-4 rounded border-[var(--gray-200)] accent-[var(--primary)] disabled:opacity-50"
            />
            <span className="text-xs font-semibold text-[var(--foreground)]">Enforce deadline</span>
          </label>

          <div>
            <label className="text-xs font-semibold text-[var(--gray-400)]">Deadline time</label>
            <input
              type="time"
              value={deadlineDraft.deadlineTime}
              disabled={!canEditDeadline || !deadlineDraft.isEnabled}
              onChange={(e) => patchDeadlineDraft({ deadlineTime: e.target.value })}
              className="mt-1 block rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-2 text-sm text-[var(--foreground)] disabled:opacity-50"
            />
          </div>

          {deadlineQuery.data?.timezone && (
            <div className="pb-2 text-xs text-[var(--gray-400)]">
              Timezone: <span className="font-semibold">{deadlineQuery.data.timezone}</span>
            </div>
          )}

          {canEditDeadline && (
            <Button
              size="sm"
              onClick={handleSaveDeadline}
              isLoading={updateDeadline.isPending}
              disabled={!deadlineDirty}
            >
              Save deadline
            </Button>
          )}
        </div>

        {!canEditDeadline && !deadlineQuery.isLoading && (
          <p className="text-xs text-[var(--gray-400)]">
            You need write access to Work Logs to change the deadline.
          </p>
        )}
        {deadlineSaved && !deadlineDirty && (
          <p className="text-xs font-semibold text-green-600">Deadline saved.</p>
        )}
        {updateDeadline.isError && (
          <p className="text-xs font-semibold text-red-600">
            Could not save the deadline. Please try again.
          </p>
        )}
      </div>

      <div>
        <label className="text-xs font-semibold text-[var(--gray-400)]">Date</label>
        <input
          type="date"
          value={date}
          max={todayIso()}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 block rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-2 text-sm text-[var(--foreground)]"
        />
      </div>

      {/* Attendance-style snapshot for the selected day. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Submitted" value={dailyStatusQuery.data?.submittedCount ?? 0} icon={Users} accentColor="var(--primary)" />
        <StatCard label="On Time" value={dailyStatusQuery.data?.onTimeCount ?? 0} icon={CheckCircle2} accentColor="#16a34a" />
        <StatCard label="Late" value={dailyStatusQuery.data?.lateCount ?? 0} icon={AlertTriangle} accentColor="#d97706" />
        <StatCard label="Pending" value={dailyStatusQuery.data?.pendingCount ?? 0} icon={Hourglass} accentColor="#64748b" />
      </div>

      <DataTable
        columns={summaryColumns}
        data={summaryQuery.data ?? []}
        isLoading={summaryQuery.isLoading}
        onRowClick={(row) =>
          setBreakdown({ userId: row.userId, employeeName: `${row.firstName} ${row.lastName}` })
        }
      />

      <WorkLogDayBreakdownModal
        isOpen={!!breakdown}
        onClose={() => setBreakdown(null)}
        userId={breakdown?.userId ?? null}
        employeeName={breakdown?.employeeName ?? ''}
        date={date}
      />
    </div>
  );
}
