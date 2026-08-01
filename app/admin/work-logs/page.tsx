'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAllWorkLogsQuery, useWorkLogSummaryQuery } from '@/hooks/queries/use-work-logs-query';
import { workLogService } from '@/lib/services/work-log.service';
import { Button, DataTable } from '@/components/ui';
import type { WorkLog, WorkLogUserSummary } from '@/types/hrModules';

type WorkLogTab = 'summary' | 'detailed';

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

export default function AdminWorkLogsPage() {
  const { isHRManager, isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<WorkLogTab>('summary');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const params = { from: from || undefined, to: to || undefined };
  const detailedQuery = useAllWorkLogsQuery(params);
  const summaryQuery = useWorkLogSummaryQuery(params);

  if (!isHRManager && !isSuperAdmin) {
    return <p className="text-sm text-[var(--gray-400)]">You do not have access to this page.</p>;
  }

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob =
        activeTab === 'summary'
          ? await workLogService.downloadSummaryReport(params)
          : await workLogService.downloadDetailedReport(params);
      downloadBlob(blob, `work-logs-${activeTab}.xlsx`);
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
  ];

  const detailedColumns: ColumnDef<WorkLog, any>[] = [
    { accessorKey: 'userId', header: 'Employee ID' },
    { accessorKey: 'workDate', header: 'Date', cell: ({ row }) => new Date(row.original.workDate).toLocaleDateString() },
    { accessorKey: 'taskDescription', header: 'Task' },
    { accessorKey: 'hoursSpent', header: 'Hours' },
    { accessorKey: 'remarks', header: 'Remarks', cell: ({ row }) => row.original.remarks || '—' },
    {
      accessorKey: 'createdAt',
      header: 'Submitted At',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString(),
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
          Export {activeTab === 'summary' ? 'Summary' : 'Detailed'} Excel
        </Button>
      </div>

      <div className="bg-[var(--card-bg)] border border-[var(--gray-100)] p-1.5 rounded-2xl shadow-sm inline-flex gap-1">
        {(['summary', 'detailed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'text-[var(--gray-400)] hover:text-[var(--foreground)] hover:bg-[var(--gray-25)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="text-xs font-semibold text-[var(--gray-400)]">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="mt-1 rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-2 text-sm text-[var(--foreground)]"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--gray-400)]">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="mt-1 rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-2 text-sm text-[var(--foreground)]"
          />
        </div>
      </div>

      {activeTab === 'summary' ? (
        <DataTable columns={summaryColumns} data={summaryQuery.data ?? []} isLoading={summaryQuery.isLoading} />
      ) : (
        <DataTable columns={detailedColumns} data={detailedQuery.data ?? []} isLoading={detailedQuery.isLoading} />
      )}
    </div>
  );
}
