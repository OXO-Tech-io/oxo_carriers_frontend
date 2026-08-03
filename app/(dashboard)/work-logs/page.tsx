'use client';

import { useRef, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Trash2, Download, Upload, AlertCircle, Clock } from 'lucide-react';
import { Button, DataTable } from '@/components/ui';
import { useMyWorkLogsQuery, useWorkLogDeadlineQuery } from '@/hooks/queries/use-work-logs-query';
import { useSubmitWorkLogMutation, useBulkUploadWorkLogMutation } from '@/hooks/mutations/use-work-log-mutations';
import { workLogService } from '@/lib/services/work-log.service';
import type { BulkUploadResult, WorkLog, WorkLogEntryDraft } from '@/types/hrModules';

const emptyRow = (): WorkLogEntryDraft => ({ workDate: new Date().toISOString().slice(0, 10), taskDescription: '', hoursSpent: 0, remarks: '' });

const formatTime = (hhmm: string) => {
  const [hour, minute] = hhmm.split(':').map(Number);
  const suffix = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${String(minute).padStart(2, '0')} ${suffix}`;
};

export default function WorkLogsPage() {
  const [activeTab, setActiveTab] = useState<'entry' | 'bulk'>('entry');
  const [rows, setRows] = useState<WorkLogEntryDraft[]>([emptyRow()]);
  const [bulkResult, setBulkResult] = useState<BulkUploadResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const myLogsQuery = useMyWorkLogsQuery();
  const deadlineQuery = useWorkLogDeadlineQuery();
  const submitMutation = useSubmitWorkLogMutation();
  const bulkUploadMutation = useBulkUploadWorkLogMutation();

  const deadline = deadlineQuery.data;
  // `hasPassed` is resolved server-side against today's date, so it already
  // accounts for the configured timezone, weekends, and leave-calendar days.
  const deadlinePassedToday = !!deadline?.isEnabled && deadline.hasPassed;

  const updateRow = (index: number, patch: Partial<WorkLogEntryDraft>) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow()]);
  const removeRow = (index: number) => setRows((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    const valid = rows.filter((r) => r.taskDescription.trim() && r.hoursSpent > 0);
    if (!valid.length) return;
    await submitMutation.mutateAsync(valid);
    setRows([emptyRow()]);
  };

  const handleDownloadTemplate = async () => {
    const blob = await workLogService.downloadTemplate();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'work-log-template.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleBulkUpload = async (file: File) => {
    const result = await bulkUploadMutation.mutateAsync(file);
    setBulkResult(result);
  };

  const columns: ColumnDef<WorkLog, any>[] = [
    { accessorKey: 'workDate', header: 'Date', cell: ({ row }) => new Date(row.original.workDate).toLocaleDateString() },
    { accessorKey: 'taskDescription', header: 'Task' },
    { accessorKey: 'hoursSpent', header: 'Hours' },
    { accessorKey: 'remarks', header: 'Remarks', cell: ({ row }) => row.original.remarks || '—' },
    {
      accessorKey: 'isLate',
      header: 'Status',
      cell: ({ row }) =>
        row.original.isLate ? (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700"
            title={
              row.original.deadlineAt
                ? `Deadline was ${new Date(row.original.deadlineAt).toLocaleString()}`
                : undefined
            }
          >
            <AlertCircle className="h-3 w-3" />
            Late submission
          </span>
        ) : (
          <span className="text-xs text-[var(--gray-400)]">—</span>
        ),
    },
  ];

  const deadlineNotice = () => {
    if (!deadline || !deadline.isEnabled) return null;

    if (deadline.exemptReason === 'weekend' || deadline.exemptReason === 'holiday') {
      const label = deadline.exemptReason === 'weekend' ? 'a weekend' : 'a holiday';
      return (
        <div className="flex items-start gap-2 rounded-xl border border-[var(--gray-100)] bg-[var(--gray-25)] p-3">
          <Clock className="h-4 w-4 mt-0.5 text-[var(--gray-400)]" />
          <p className="text-xs text-[var(--gray-400)]">
            Today is {label}, so the {formatTime(deadline.deadlineTime)} work log deadline does not apply.
          </p>
        </div>
      );
    }

    if (deadlinePassedToday) {
      return (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <AlertCircle className="h-4 w-4 mt-0.5 text-amber-600" />
          <p className="text-xs text-amber-800">
            Today&apos;s {formatTime(deadline.deadlineTime)} deadline has passed. You can still submit —
            entries will be recorded as <span className="font-semibold">late submissions</span>.
          </p>
        </div>
      );
    }

    return (
      <div className="flex items-start gap-2 rounded-xl border border-[var(--gray-100)] bg-[var(--gray-25)] p-3">
        <Clock className="h-4 w-4 mt-0.5 text-[var(--primary)]" />
        <p className="text-xs text-[var(--gray-400)]">
          Submit today&apos;s work log before{' '}
          <span className="font-semibold text-[var(--foreground)]">{formatTime(deadline.deadlineTime)}</span>.
          Later submissions are still accepted but recorded as late. Weekends and holidays are exempt.
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Work Log</h1>
        <p className="text-[var(--gray-400)]">Log your daily tasks, one entry at a time or via bulk Excel upload</p>
      </div>

      {deadlineNotice()}

      <div className="flex space-x-1 p-1 bg-[var(--gray-25)] rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('entry')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'entry' ? 'bg-[var(--card-bg)] text-[var(--primary)] shadow-sm' : 'text-[var(--gray-400)]'}`}
        >
          Daily Entry
        </button>
        <button
          onClick={() => setActiveTab('bulk')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'bulk' ? 'bg-[var(--card-bg)] text-[var(--primary)] shadow-sm' : 'text-[var(--gray-400)]'}`}
        >
          Bulk Upload
        </button>
      </div>

      {activeTab === 'entry' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {rows.map((row, index) => (
              <div key={index} className="flex flex-wrap items-end gap-3 rounded-xl border border-[var(--gray-100)] p-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--gray-400)]">Date</label>
                  <input
                    type="date"
                    value={row.workDate}
                    onChange={(e) => updateRow(index, { workDate: e.target.value })}
                    className="mt-1 rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-2 text-sm text-[var(--foreground)]"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="text-xs font-semibold text-[var(--gray-400)]">Task Description</label>
                  <input
                    value={row.taskDescription}
                    onChange={(e) => updateRow(index, { taskDescription: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-2 text-sm text-[var(--foreground)]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--gray-400)]">Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={row.hoursSpent}
                    onChange={(e) => updateRow(index, { hoursSpent: Number(e.target.value) })}
                    className="mt-1 w-24 rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-2 text-sm text-[var(--foreground)]"
                  />
                </div>
                <div className="flex-1 min-w-[150px]">
                  <label className="text-xs font-semibold text-[var(--gray-400)]">Remarks</label>
                  <input
                    value={row.remarks ?? ''}
                    onChange={(e) => updateRow(index, { remarks: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-2 text-sm text-[var(--foreground)]"
                  />
                </div>
                {rows.length > 1 && (
                  <button type="button" onClick={() => removeRow(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={addRow}>
              Add another task
            </Button>
            <Button onClick={handleSubmit} isLoading={submitMutation.isPending}>
              Submit
            </Button>
          </div>

          <div className="pt-4">
            <h3 className="text-sm font-bold text-[var(--foreground)] mb-3">My Submissions</h3>
            <DataTable columns={columns} data={myLogsQuery.data ?? []} isLoading={myLogsQuery.isLoading} />
          </div>
        </div>
      )}

      {activeTab === 'bulk' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={handleDownloadTemplate}>
              Download Template
            </Button>
            <Button
              leftIcon={<Upload className="h-4 w-4" />}
              onClick={() => fileInputRef.current?.click()}
              isLoading={bulkUploadMutation.isPending}
            >
              Upload Excel
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleBulkUpload(file);
              }}
            />
          </div>

          {bulkResult && (
            <div className="rounded-xl border border-[var(--gray-100)] p-4 space-y-2">
              <p className="text-sm font-semibold text-[var(--foreground)]">
                {bulkResult.success} succeeded, {bulkResult.failed} failed
                {!!bulkResult.late && `, ${bulkResult.late} recorded as late`}
              </p>
              {bulkResult.errors.length > 0 && (
                <ul className="text-xs text-red-500 space-y-0.5">
                  {bulkResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
