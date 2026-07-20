'use client';

import { useParams } from 'next/navigation';
import { Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFormQuery, useFormResponsesQuery } from '@/hooks/queries/use-forms-query';
import { formService } from '@/lib/services/form.service';
import { Button } from '@/components/ui';

export default function FormResponsesClient() {
  const params = useParams<{ id: string }>();
  const formId = Number(params.id);
  const { isHR, isSuperAdmin } = useAuth();

  const formQuery = useFormQuery(formId);
  const responsesQuery = useFormResponsesQuery(formId);

  if (!isHR && !isSuperAdmin) {
    return <p className="text-sm text-[var(--gray-400)]">You do not have access to this page.</p>;
  }

  const handleExport = async () => {
    const blob = await formService.downloadResponses(formId);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `form-${formId}-responses.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const fields = formQuery.data?.fields ?? [];
  const responses = responsesQuery.data ?? [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">{formQuery.data?.form.title ?? 'Responses'}</h1>
          <p className="text-[var(--gray-400)]">{responses.length} response(s)</p>
        </div>
        <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={handleExport}>
          Export to Excel
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--gray-100)]">
        <table className="min-w-full divide-y divide-[var(--gray-100)]">
          <thead className="bg-[var(--gray-25)]">
            <tr>
              <th className="px-6 py-3.5 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Submitted By</th>
              <th className="px-6 py-3.5 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Submitted At</th>
              {fields.map((field) => (
                <th key={field.id} className="px-6 py-3.5 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">
                  {field.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-[var(--card-bg)] divide-y divide-[var(--gray-100)]">
            {responses.map(({ response, answers, user }) => (
              <tr key={response.id}>
                <td className="px-6 py-4 text-sm text-[var(--foreground)]">
                  {user ? `${user.first_name} ${user.last_name}` : `User #${response.userId}`}
                </td>
                <td className="px-6 py-4 text-sm text-[var(--foreground)]">{new Date(response.submittedAt).toLocaleString()}</td>
                {fields.map((field) => {
                  const answer = answers.find((a) => a.fieldId === field.id);
                  return (
                    <td key={field.id} className="px-6 py-4 text-sm text-[var(--foreground)]">
                      {field.fieldType === 'file' ? (answer ? 'File uploaded' : '—') : answer?.valueText ?? '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
