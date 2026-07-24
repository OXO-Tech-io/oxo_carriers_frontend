'use client';

import { FileUpload } from '@/components/ui';
import type { FormQuestion } from '@/types/hrModules';

// The read-only/fill-mode renderer for all 19 question types — shared between the real fill-form
// page (app/(dashboard)/my-forms/[id]/FillFormClient.tsx) and the builder's preview modal, so
// there's only one renderer, not two that can drift apart.
//
// Answer value shapes by type:
//   short_answer/paragraph/email/url/date/time/datetime/dropdown/multiple_choice/yes_no -> string
//   number/linear_scale/rating                                                          -> number
//   checkboxes                                                                          -> string[]
//   multiple_choice_grid                                                                -> Record<row, col>
//   checkbox_grid                                                                       -> Record<row, col[]>
//   file_upload                                                                         -> handled via `file`/`onFileChange`, not `value`

const inputClass =
  'mt-1 w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-2.5 text-sm text-[var(--foreground)] transition-colors focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-ring)] disabled:opacity-60';

const choiceRowClass =
  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--foreground)] transition-colors hover:bg-[var(--gray-50)] has-[:disabled]:hover:bg-transparent';

const choiceInputClass = 'h-4 w-4 accent-[var(--primary)]';

interface QuestionFieldProps {
  question: FormQuestion;
  value: unknown;
  onChange: (value: unknown) => void;
  file?: File | null;
  existingFileName?: string | null;
  onFileChange?: (file: File | null) => void;
  disabled?: boolean;
}

const num = (config: Record<string, unknown>, key: string, fallback: number): number => {
  const v = config[key];
  return typeof v === 'number' ? v : fallback;
};
const str = (config: Record<string, unknown>, key: string, fallback: string): string => {
  const v = config[key];
  return typeof v === 'string' ? v : fallback;
};
const bool = (config: Record<string, unknown>, key: string): boolean => config[key] === true;

export function QuestionField({ question, value, onChange, file, existingFileName, onFileChange, disabled = false }: QuestionFieldProps) {
  const { type, config, options } = question;

  switch (type) {
    case 'short_answer':
      return (
        <input
          type="text"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder ?? undefined}
          maxLength={num(config, 'maxLength', 0) || undefined}
          disabled={disabled}
          className={inputClass}
        />
      );

    case 'paragraph':
      return (
        <textarea
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder ?? undefined}
          maxLength={num(config, 'maxLength', 0) || undefined}
          rows={4}
          disabled={disabled}
          className={inputClass}
        />
      );

    case 'email':
      return (
        <input
          type="email"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder ?? 'name@example.com'}
          disabled={disabled}
          className={inputClass}
        />
      );

    case 'url':
      return (
        <input
          type="url"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder ?? 'https://…'}
          disabled={disabled}
          className={inputClass}
        />
      );

    case 'number':
      return (
        <input
          type="number"
          value={typeof value === 'number' ? value : ''}
          onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
          min={config['min'] as number | undefined}
          max={config['max'] as number | undefined}
          placeholder={question.placeholder ?? undefined}
          disabled={disabled}
          className={inputClass}
        />
      );

    case 'date':
      return (
        <input
          type="date"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={inputClass}
        />
      );

    case 'time':
      return (
        <input
          type="time"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={inputClass}
        />
      );

    case 'datetime':
      return (
        <input
          type="datetime-local"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={inputClass}
        />
      );

    case 'dropdown':
      return (
        <select
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={inputClass}
        >
          <option value="">Select…</option>
          {options.map((opt) => (
            <option key={opt.id} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );

    case 'yes_no':
      return (
        <div className="mt-2 flex gap-2">
          {['Yes', 'No'].map((opt) => (
            <label key={opt} className={choiceRowClass}>
              <input
                type="radio"
                name={`question-${question.id}`}
                checked={value === opt}
                onChange={() => onChange(opt)}
                disabled={disabled}
                className={choiceInputClass}
              />
              {opt}
            </label>
          ))}
        </div>
      );

    case 'multiple_choice': {
      const allowOther = bool(config, 'allowOther');
      const isOtherSelected = typeof value === 'string' && value !== '' && !options.some((o) => o.value === value);
      return (
        <div className="mt-2 space-y-1">
          {options.map((opt) => (
            <label key={opt.id} className={choiceRowClass}>
              <input
                type="radio"
                name={`question-${question.id}`}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                disabled={disabled}
                className={choiceInputClass}
              />
              {opt.label}
            </label>
          ))}
          {allowOther && (
            <label className={choiceRowClass}>
              <input
                type="radio"
                name={`question-${question.id}`}
                checked={isOtherSelected}
                onChange={() => onChange('')}
                disabled={disabled}
                className={choiceInputClass}
              />
              <span>Other:</span>
              <input
                type="text"
                value={isOtherSelected ? (value as string) : ''}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled || !isOtherSelected}
                className="flex-1 rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] px-2 py-1 text-sm text-[var(--foreground)] disabled:opacity-50"
              />
            </label>
          )}
        </div>
      );
    }

    case 'checkboxes': {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      const toggle = (v: string) =>
        onChange(selected.includes(v) ? selected.filter((s) => s !== v) : [...selected, v]);
      return (
        <div className="mt-2 space-y-1">
          {options.map((opt) => (
            <label key={opt.id} className={choiceRowClass}>
              <input
                type="checkbox"
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                disabled={disabled}
                className={choiceInputClass}
              />
              {opt.label}
            </label>
          ))}
        </div>
      );
    }

    case 'linear_scale': {
      const min = num(config, 'min', 1);
      const max = num(config, 'max', 5);
      const minLabel = str(config, 'minLabel', '');
      const maxLabel = str(config, 'maxLabel', '');
      const steps = Array.from({ length: Math.max(0, max - min + 1) }, (_, i) => min + i);
      return (
        <div className="mt-2 flex items-center gap-3 text-xs text-[var(--gray-400)]">
          {minLabel && <span>{minLabel}</span>}
          {steps.map((s) => (
            <label key={s} className="flex flex-col items-center gap-1">
              <input
                type="radio"
                name={`question-${question.id}`}
                checked={value === s}
                onChange={() => onChange(s)}
                disabled={disabled}
                className={choiceInputClass}
              />
              <span>{s}</span>
            </label>
          ))}
          {maxLabel && <span>{maxLabel}</span>}
        </div>
      );
    }

    case 'rating': {
      const max = num(config, 'max', 5);
      const current = typeof value === 'number' ? value : 0;
      return (
        <div className="mt-2 flex gap-1">
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              disabled={disabled}
              onClick={() => onChange(n)}
              className={`text-2xl leading-none ${n <= current ? 'text-[var(--warning)]' : 'text-[var(--gray-200)]'}`}
              aria-label={`Rate ${n}`}
            >
              ★
            </button>
          ))}
        </div>
      );
    }

    case 'multiple_choice_grid':
    case 'checkbox_grid': {
      const columns = Array.isArray(config['columns']) ? (config['columns'] as string[]) : [];
      const gridValue = (typeof value === 'object' && value !== null ? value : {}) as Record<string, unknown>;
      const isCheckboxGrid = type === 'checkbox_grid';
      const setCell = (rowValue: string, colValue: string) => {
        if (isCheckboxGrid) {
          const current = Array.isArray(gridValue[rowValue]) ? (gridValue[rowValue] as string[]) : [];
          const next = current.includes(colValue) ? current.filter((c) => c !== colValue) : [...current, colValue];
          onChange({ ...gridValue, [rowValue]: next });
        } else {
          onChange({ ...gridValue, [rowValue]: colValue });
        }
      };
      return (
        <div className="mt-2 overflow-x-auto">
          <table className="text-xs">
            <thead>
              <tr>
                <td />
                {columns.map((c) => (
                  <td key={c} className="px-2 pb-1 text-center text-[var(--gray-400)]">
                    {c}
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              {options.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap py-1 pr-3 text-[var(--foreground)]">{row.label}</td>
                  {columns.map((c) => (
                    <td key={c} className="px-2 text-center">
                      <input
                        type={isCheckboxGrid ? 'checkbox' : 'radio'}
                        name={isCheckboxGrid ? undefined : `question-${question.id}-${row.value}`}
                        checked={
                          isCheckboxGrid
                            ? Array.isArray(gridValue[row.value]) && (gridValue[row.value] as string[]).includes(c)
                            : gridValue[row.value] === c
                        }
                        onChange={() => setCell(row.value, c)}
                        disabled={disabled}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case 'file_upload':
      return (
        <div className="mt-1">
          <FileUpload
            existingFiles={existingFileName ? [{ name: existingFileName, url: '#' }] : []}
            onFilesSelected={(selected) => onFileChange?.(selected[0] ?? null)}
          />
          {file && !existingFileName && <p className="mt-1 text-xs text-[var(--gray-400)]">Selected: {file.name}</p>}
        </div>
      );

    default:
      return null;
  }
}
