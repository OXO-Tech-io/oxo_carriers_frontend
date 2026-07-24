'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import { ArrowLeft, Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFormQuery, useFormResponsesQuery } from '@/hooks/queries/use-forms-query';
import { formService } from '@/lib/services/form.service';
import { Button, DataTable, Modal } from '@/components/ui';
import type { FormResponseAnswer, FormResponseWithAnswers } from '@/types/hrModules';

const answerDisplay = (answer: FormResponseAnswer | undefined): string => {
  if (!answer) return '—';
  if (answer.valueText) return answer.valueText;
  if (answer.value == null || answer.value === '') return '—';
  if (Array.isArray(answer.value)) return answer.value.join(', ');
  if (typeof answer.value === 'object') return JSON.stringify(answer.value);
  return String(answer.value);
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export default function FormResponsesClient() {
  const params = useParams<{ id: string }>();
  const formId = Number(params.id);
  const { isHR, isSuperAdmin } = useAuth();
  const [detail, setDetail] = useState<FormResponseWithAnswers | null>(null);
  const [exporting, setExporting] = useState<'csv' | 'xlsx' | null>(null);

  const formQuery = useFormQuery(formId);
  const responsesQuery = useFormResponsesQuery(formId);

  if (!isHR && !isSuperAdmin) {
    return <p className="text-sm text-[var(--gray-400)]">You do not have access to this page.</p>;
  }

  const handleExport = async (format: 'csv' | 'xlsx') => {
    setExporting(format);
    try {
      const blob = await formService.downloadResponses(formId, format);
      downloadBlob(blob, `form-${formId}-responses.${format}`);
    } finally {
      setExporting(null);
    }
  };

  const questions = [...(formQuery.data?.questions ?? [])]
    .filter((q) => q.type !== 'section_header' && q.type !== 'rich_text')
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const responses = responsesQuery.data ?? [];

  const columns: ColumnDef<FormResponseWithAnswers, any>[] = [
    {
      id: 'user',
      header: 'Submitted By',
      cell: ({ row }) =>
        row.original.user ? `${row.original.user.firstName} ${row.original.user.lastName}` : `User #${row.original.response.userId}`,
    },
    {
      id: 'email',
      header: 'Email',
      cell: ({ row }) => row.original.user?.email ?? '—',
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.original.response.status === 'submitted' ? 'bg-emerald-100 text-emerald-700' : 'bg-[var(--gray-100)] text-[var(--gray-400)]'
          }`}
        >
          {row.original.response.status === 'submitted' ? 'Submitted' : 'In progress'}
        </span>
      ),
    },
    {
      id: 'submittedAt',
      header: 'Submitted At',
      cell: ({ row }) => (row.original.response.submittedAt ? new Date(row.original.response.submittedAt).toLocaleString() : '—'),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <button onClick={() => setDetail(row.original)} className="text-sm font-semibold text-[var(--primary)] hover:underline">
          View
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <Link href={`/admin/forms/${formId}/edit`} className="flex items-center gap-1.5 text-sm font-semibold text-[var(--gray-400)] hover:text-[var(--foreground)]">
            <ArrowLeft className="h-4 w-4" /> Back to builder
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-[var(--foreground)]">{formQuery.data?.form.title ?? 'Responses'}</h1>
          <p className="text-[var(--gray-400)]">{responses.length} response(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} isLoading={exporting === 'csv'} onClick={() => handleExport('csv')}>
            Export CSV
          </Button>
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} isLoading={exporting === 'xlsx'} onClick={() => handleExport('xlsx')}>
            Export Excel
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={responses}
        isLoading={responsesQuery.isLoading}
        getRowId={(r) => String(r.response.id)}
        onRowClick={(r) => setDetail(r)}
        emptyTitle="No responses yet"
        emptyDescription="Responses will appear here once employees start submitting this form."
      />

      <Modal
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.user ? `${detail.user.firstName} ${detail.user.lastName}` : 'Response'}
        size="lg"
      >
        {detail && (
          <div className="space-y-4">
            <p className="text-xs text-[var(--gray-400)]">
              {detail.response.status === 'submitted' && detail.response.submittedAt
                ? `Submitted ${new Date(detail.response.submittedAt).toLocaleString()}`
                : 'In progress'}
            </p>
            <div className="space-y-3 divide-y divide-[var(--gray-50)]">
              {questions.map((q) => (
                <div key={q.id} className="pt-3 first:pt-0">
                  <p className="text-xs font-semibold text-[var(--gray-400)]">{q.title || 'Untitled question'}</p>
                  <p className="text-sm text-[var(--foreground)]">{answerDisplay(detail.answers.find((a) => a.questionId === q.id))}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
