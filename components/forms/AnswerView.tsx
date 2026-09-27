'use client';

import { Paperclip } from 'lucide-react';
import { resolveFileUrl } from '@/lib/constants';
import type { FormQuestion, FormResponseAnswer } from '@/types/hrModules';

const GRID_TYPES = new Set(['multiple_choice_grid', 'checkbox_grid']);

function plainAnswerText(answer: FormResponseAnswer | undefined): string {
  if (!answer) return '—';
  if (answer.valueText) return answer.valueText;
  if (answer.value == null || answer.value === '') return '—';
  if (Array.isArray(answer.value)) return answer.value.join(', ');
  if (typeof answer.value === 'object') return JSON.stringify(answer.value);
  return String(answer.value);
}

// Shared read-only answer renderer for the admin Responses viewer and a recipient's own
// already-submitted view, so grid/file answers render identically (and consistently) in both
// places instead of each screen reimplementing its own raw-JSON fallback.
export function AnswerView({ question, answer }: { question: FormQuestion; answer: FormResponseAnswer | undefined }) {
  if (question.type === 'file_upload') {
    const attachments = answer?.attachments ?? [];
    if (!attachments.length) return <span className="text-sm text-[var(--gray-400)]">—</span>;
    return (
      <ul className="space-y-1">
        {attachments.map((att) => (
          <li key={att.id}>
            <a
              href={resolveFileUrl(att.fileUrl)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--primary)] hover:underline"
            >
              <Paperclip className="h-3.5 w-3.5 shrink-0" />
              {att.fileName}
            </a>
          </li>
        ))}
      </ul>
    );
  }

  if (GRID_TYPES.has(question.type)) {
    const columns = Array.isArray(question.config['columns']) ? (question.config['columns'] as string[]) : [];
    if (!answer || !question.options.length || !columns.length) {
      return <span className="text-sm text-[var(--gray-400)]">—</span>;
    }
    const gridValue = (typeof answer.value === 'object' && answer.value !== null ? answer.value : {}) as Record<string, unknown>;
    const isCheckboxGrid = question.type === 'checkbox_grid';
    const isSelected = (rowValue: string, col: string) => {
      const cell = gridValue[rowValue];
      return isCheckboxGrid ? Array.isArray(cell) && cell.includes(col) : cell === col;
    };
    return (
      <div className="overflow-x-auto">
        <table className="text-xs">
          <thead>
            <tr>
              <td />
              {columns.map((c) => (
                <td key={c} className="px-2 pb-1 text-center font-semibold text-[var(--gray-400)]">
                  {c}
                </td>
              ))}
            </tr>
          </thead>
          <tbody>
            {question.options.map((row) => (
              <tr key={row.id}>
                <td className="whitespace-nowrap py-1 pr-3 text-[var(--foreground)]">{row.label}</td>
                {columns.map((c) => (
                  <td key={c} className="px-2 text-center text-[var(--primary)]">
                    {isSelected(row.value, c) ? '✓' : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return <span className="whitespace-pre-line text-sm text-[var(--foreground)]">{plainAnswerText(answer)}</span>;
}
