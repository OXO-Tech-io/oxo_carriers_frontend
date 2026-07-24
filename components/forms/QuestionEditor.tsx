'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, GitBranch, GripVertical, Plus, Trash2 } from 'lucide-react';
import { QUESTION_TYPES, questionTypeUi } from './questionTypes';
import type { FormQuestion, FormQuestionOption, FormSection } from '@/types/hrModules';

interface QuestionEditorProps {
  question: FormQuestion;
  sections: FormSection[];
  dragProps: React.HTMLAttributes<HTMLDivElement>;
  onChange: (patch: Partial<FormQuestion> | ((current: FormQuestion) => Partial<FormQuestion>)) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onOpenLogic: () => void;
  logicRuleCount: number;
  active: boolean;
  onActivate: () => void;
  dragging?: boolean;
  dropTarget?: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const num = (config: Record<string, unknown>, key: string, fallback: number): number => {
  const v = config[key];
  return typeof v === 'number' ? v : fallback;
};
const str = (config: Record<string, unknown>, key: string, fallback: string): string => {
  const v = config[key];
  return typeof v === 'string' ? v : fallback;
};
const bool = (config: Record<string, unknown>, key: string, fallback: boolean): boolean => {
  const v = config[key];
  return typeof v === 'boolean' ? v : fallback;
};

const fieldInput =
  'w-full rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] px-2.5 py-1.5 text-sm text-[var(--foreground)]';
const smallInput =
  'w-20 rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] px-2 py-1 text-sm text-[var(--foreground)]';

// Single component branching internally on `type` (19 types with heavy config overlap — not worth
// splitting into per-type files). Config fields are grouped by `configKind`
// (text/choice/file/scale/rating/number/grid/none) — see components/forms/questionTypes.ts.
export function QuestionEditor({
  question,
  sections,
  dragProps,
  onChange,
  onDuplicate,
  onDelete,
  onOpenLogic,
  logicRuleCount,
  active,
  onActivate,
  dragging = false,
  dropTarget = false,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: QuestionEditorProps) {
  const ui = questionTypeUi(question.type);
  const isGrid = ui.configKind === 'grid';
  const [descOpen, setDescOpen] = useState(Boolean(question.description));

  const setConfig = (patch: Record<string, unknown>) => onChange((q) => ({ config: { ...q.config, ...patch } }));

  const setOptions = (updater: (prev: FormQuestionOption[]) => FormQuestionOption[]) =>
    onChange((q) => ({ options: updater(q.options) }));
  const addOption = () => {
    setOptions((prev) => {
      const n = prev.length + 1;
      const label = isGrid ? `Row ${n}` : `Option ${n}`;
      return [...prev, { id: -(Date.now() * 1000 + prev.length), questionId: question.id, label, value: label, orderIndex: prev.length, isOther: false }];
    });
  };
  const updateOption = (idx: number, patch: Partial<FormQuestionOption>) =>
    setOptions((prev) => prev.map((o, i) => (i === idx ? { ...o, ...patch } : o)));
  const removeOption = (idx: number) => setOptions((prev) => prev.filter((_, i) => i !== idx));

  const columns = Array.isArray(question.config['columns']) ? (question.config['columns'] as string[]) : [];
  const setColumns = (updater: (prev: string[]) => string[]) =>
    onChange((q) => {
      const prevColumns = Array.isArray(q.config['columns']) ? (q.config['columns'] as string[]) : [];
      return { config: { ...q.config, columns: updater(prevColumns) } };
    });
  const addColumn = () => setColumns((prev) => [...prev, `Column ${prev.length + 1}`]);
  const updateColumn = (idx: number, value: string) => setColumns((prev) => prev.map((c, i) => (i === idx ? value : c)));
  const removeColumn = (idx: number) => setColumns((prev) => prev.filter((_, i) => i !== idx));

  const accentClass = dropTarget
    ? 'border-[var(--primary)] bg-[var(--primary-light)]'
    : active
      ? 'border-[var(--primary)]'
      : 'border-[var(--gray-100)]';

  const MoveHandle = (
    <div className="flex items-center gap-1">
      <GripVertical className="h-4 w-4 cursor-grab text-[var(--gray-300)]" />
      <div className="flex flex-col">
        <button type="button" disabled={!canMoveUp} onClick={onMoveUp} aria-label="Move up" className="text-[var(--gray-400)] disabled:opacity-30 hover:text-[var(--foreground)]">
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button type="button" disabled={!canMoveDown} onClick={onMoveDown} aria-label="Move down" className="text-[var(--gray-400)] disabled:opacity-30 hover:text-[var(--foreground)]">
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );

  // Layout blocks (section header / static description text) carry no answer, no required toggle,
  // no logic, no options — minimal card.
  if (question.type === 'section_header' || question.type === 'rich_text') {
    return (
      <div id={`form-question-${question.id}`} {...dragProps} onFocusCapture={onActivate} className={`rounded-2xl border p-4 bg-[var(--card-bg)] transition-opacity ${accentClass} ${dragging ? 'opacity-40' : ''}`}>
        <div className="flex items-center gap-2">
          {MoveHandle}
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--gray-400)]">{ui.label}</span>
          <div className="flex-1">
            {question.type === 'section_header' ? (
              <input
                value={question.title}
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder="Section header text"
                className={`${fieldInput} font-semibold`}
              />
            ) : (
              <textarea
                value={question.title}
                onChange={(e) => onChange({ title: e.target.value })}
                placeholder="Static description text shown to respondents"
                rows={2}
                className={fieldInput}
              />
            )}
          </div>
          <button type="button" onClick={onDuplicate} aria-label="Duplicate" className="p-1.5 text-[var(--gray-400)] hover:bg-[var(--gray-50)] rounded-lg">
            <Copy className="h-4 w-4" />
          </button>
          <button type="button" onClick={onDelete} aria-label="Delete" className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id={`form-question-${question.id}`} {...dragProps} onFocusCapture={onActivate} className={`rounded-2xl border p-4 bg-[var(--card-bg)] transition-opacity space-y-4 ${accentClass} ${dragging ? 'opacity-40' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        {MoveHandle}
        <ui.icon className="h-4 w-4 shrink-0 text-[var(--gray-400)]" />
        <div className="flex-1 min-w-[160px]">
          <input value={question.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="Question" className={`${fieldInput} font-semibold`} />
        </div>
        <select
          value={question.type}
          onChange={(e) => onChange({ type: e.target.value as FormQuestion['type'] })}
          className="rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] px-2 py-1.5 text-sm text-[var(--foreground)]"
        >
          {QUESTION_TYPES.filter((t) => !t.isLayout).map((t) => (
            <option key={t.type} value={t.type}>
              {t.label}
            </option>
          ))}
        </select>
        {sections.length > 0 && (
          <select
            value={question.sectionId != null ? String(question.sectionId) : ''}
            onChange={(e) => onChange({ sectionId: e.target.value ? Number(e.target.value) : null })}
            className="rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] px-2 py-1.5 text-sm text-[var(--foreground)]"
          >
            <option value="">No section</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title || 'Untitled section'}
              </option>
            ))}
          </select>
        )}
      </div>

      {descOpen ? (
        <input
          value={question.description ?? ''}
          onChange={(e) => onChange({ description: e.target.value || null })}
          placeholder="Description (optional)"
          className={fieldInput}
        />
      ) : (
        <button type="button" onClick={() => setDescOpen(true)} className="text-xs font-semibold text-[var(--primary)] hover:underline">
          + Add description
        </button>
      )}

      {ui.hasOptions && (
        <div className="space-y-2">
          {question.options.map((opt, idx) => (
            <div key={opt.id} className="flex items-center gap-2">
              <span className="text-xs text-[var(--gray-400)]">{question.type === 'checkboxes' ? '☐' : '○'}</span>
              <input value={opt.label} onChange={(e) => updateOption(idx, { label: e.target.value, value: e.target.value })} className={`${fieldInput} flex-1`} />
              <button type="button" onClick={() => removeOption(idx)} aria-label="Remove option" className="p-1 text-[var(--gray-400)] hover:text-red-500">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addOption} className="flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline">
            <Plus className="h-3.5 w-3.5" /> Add option
          </button>
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--gray-400)]">
              <input type="checkbox" checked={bool(question.config, 'allowOther', false)} onChange={(e) => setConfig({ allowOther: e.target.checked })} />
              Allow &quot;Other&quot;
            </label>
            {question.type === 'checkboxes' && (
              <>
                <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--gray-400)]">
                  Min selections
                  <input type="number" min={0} value={num(question.config, 'minSelections', 0)} onChange={(e) => setConfig({ minSelections: Number(e.target.value) })} className={smallInput} />
                </label>
                <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--gray-400)]">
                  Max selections
                  <input
                    type="number"
                    min={0}
                    value={num(question.config, 'maxSelections', question.options.length)}
                    onChange={(e) => setConfig({ maxSelections: Number(e.target.value) })}
                    className={smallInput}
                  />
                </label>
              </>
            )}
          </div>
        </div>
      )}

      {isGrid && (
        <div className="flex flex-wrap gap-6">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--gray-400)]">Rows</p>
            {question.options.map((opt, idx) => (
              <div key={opt.id} className="flex items-center gap-2">
                <input value={opt.label} onChange={(e) => updateOption(idx, { label: e.target.value, value: e.target.value })} className={`${fieldInput} w-40`} />
                <button type="button" onClick={() => removeOption(idx)} aria-label="Remove row" className="p-1 text-[var(--gray-400)] hover:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addOption} className="flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline">
              <Plus className="h-3.5 w-3.5" /> Add row
            </button>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--gray-400)]">Columns</p>
            {columns.map((c, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input value={c} onChange={(e) => updateColumn(idx, e.target.value)} className={`${fieldInput} w-40`} />
                <button type="button" onClick={() => removeColumn(idx)} aria-label="Remove column" className="p-1 text-[var(--gray-400)] hover:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button type="button" onClick={addColumn} className="flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline">
              <Plus className="h-3.5 w-3.5" /> Add column
            </button>
          </div>
        </div>
      )}

      {ui.configKind === 'text' && (
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={question.placeholder ?? ''}
            onChange={(e) => onChange({ placeholder: e.target.value || null })}
            placeholder="Placeholder text (optional)"
            className={`${fieldInput} flex-1 min-w-[160px]`}
          />
          <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--gray-400)]">
            Max length
            <input type="number" min={0} value={num(question.config, 'maxLength', 0)} onChange={(e) => setConfig({ maxLength: Number(e.target.value) || undefined })} className={smallInput} />
          </label>
        </div>
      )}

      {ui.configKind === 'number' && (
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--gray-400)]">
            Min
            <input type="number" value={num(question.config, 'min', 0)} onChange={(e) => setConfig({ min: Number(e.target.value) })} className={smallInput} />
          </label>
          <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--gray-400)]">
            Max
            <input type="number" value={num(question.config, 'max', 100)} onChange={(e) => setConfig({ max: Number(e.target.value) })} className={smallInput} />
          </label>
        </div>
      )}

      {ui.configKind === 'scale' && (
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--gray-400)]">
            From
            <input type="number" value={num(question.config, 'min', 1)} onChange={(e) => setConfig({ min: Number(e.target.value) })} className={smallInput} />
          </label>
          <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--gray-400)]">
            To
            <input type="number" value={num(question.config, 'max', 5)} onChange={(e) => setConfig({ max: Number(e.target.value) })} className={smallInput} />
          </label>
          <input value={str(question.config, 'minLabel', '')} onChange={(e) => setConfig({ minLabel: e.target.value })} placeholder="Low label (e.g. Poor)" className={`${fieldInput} flex-1 min-w-[140px]`} />
          <input value={str(question.config, 'maxLabel', '')} onChange={(e) => setConfig({ maxLabel: e.target.value })} placeholder="High label (e.g. Excellent)" className={`${fieldInput} flex-1 min-w-[140px]`} />
        </div>
      )}

      {ui.configKind === 'rating' && (
        <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--gray-400)]">
          Max stars
          <select value={String(num(question.config, 'max', 5))} onChange={(e) => setConfig({ max: Number(e.target.value) })} className="rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] px-2 py-1 text-sm text-[var(--foreground)]">
            <option value="5">5</option>
            <option value="10">10</option>
          </select>
        </label>
      )}

      {ui.configKind === 'file' && (
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={(question.config['allowedMimeTypes'] as string[] | undefined)?.join(', ') ?? ''}
            onChange={(e) => setConfig({ allowedMimeTypes: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
            placeholder="Allowed types: pdf, doc, docx, png, jpg, xlsx, csv, zip"
            className={`${fieldInput} flex-1 min-w-[220px]`}
          />
          <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--gray-400)]">
            Max size (MB)
            <input type="number" min={1} value={num(question.config, 'maxSizeMb', 10)} onChange={(e) => setConfig({ maxSizeMb: Number(e.target.value) })} className={smallInput} />
          </label>
          <label className="flex items-center gap-1.5 text-xs font-medium text-[var(--gray-400)]">
            Max files
            <input type="number" min={1} value={num(question.config, 'maxFiles', 1)} onChange={(e) => setConfig({ maxFiles: Number(e.target.value) })} className={smallInput} />
          </label>
        </div>
      )}

      <input
        value={question.helpText ?? ''}
        onChange={(e) => onChange({ helpText: e.target.value || null })}
        placeholder="Help text shown below the question (optional)"
        className={`${fieldInput} text-xs`}
      />

      <div className="flex items-center justify-between pt-1 border-t border-[var(--gray-50)]">
        <div className="flex items-center gap-1">
          <button type="button" onClick={onDuplicate} aria-label="Duplicate" className="p-1.5 text-[var(--gray-400)] hover:bg-[var(--gray-50)] rounded-lg">
            <Copy className="h-4 w-4" />
          </button>
          <button type="button" onClick={onDelete} aria-label="Delete" className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onOpenLogic}
            aria-label="Question logic"
            className={`flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold ${
              logicRuleCount > 0 ? 'bg-[var(--primary-light)] text-[var(--primary)]' : 'text-[var(--gray-400)] hover:bg-[var(--gray-50)]'
            }`}
          >
            <GitBranch className="h-4 w-4" />
            {logicRuleCount > 0 ? `Logic (${logicRuleCount})` : 'Logic'}
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-[var(--gray-400)]">
          Required
          <input type="checkbox" checked={question.required} onChange={() => onChange({ required: !question.required })} />
        </label>
      </div>
    </div>
  );
}
