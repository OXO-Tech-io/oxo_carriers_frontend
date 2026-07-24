'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import type { FormLogicAction, FormLogicCombinator, FormLogicComparator, FormLogicRule, FormQuestion } from '@/types/hrModules';

const COMPARATOR_OPTIONS: { value: FormLogicComparator; label: string }[] = [
  { value: 'equals', label: 'is' },
  { value: 'not_equals', label: 'is not' },
  { value: 'contains', label: 'contains' },
  { value: 'greater_than', label: 'is greater than' },
  { value: 'less_than', label: 'is less than' },
  { value: 'is_empty', label: 'is empty' },
  { value: 'is_not_empty', label: 'is not empty' },
];

const needsValue = (c: FormLogicComparator): boolean => c !== 'is_empty' && c !== 'is_not_empty';

interface FormLogicPanelProps {
  open: boolean;
  onClose: () => void;
  question: FormQuestion | null;
  /** Every other question in the form — candidate condition sources. */
  allQuestions: FormQuestion[];
  /** Rules already targeting `question` (i.e. controlling its visibility). */
  rules: FormLogicRule[];
  onAdd: (params: {
    targetQuestionId: number;
    sourceQuestionId: number;
    comparator: FormLogicComparator;
    comparisonValue: unknown;
    action: FormLogicAction;
    combinator: FormLogicCombinator;
  }) => void;
  onUpdate: (id: number, patch: Partial<FormLogicRule>) => void;
  onDelete: (id: number) => void;
}

// Rendered inside the shared `Modal` primitive (size lg) rather than a new `Drawer` — this app has
// no drawer component and a modal is sufficient here.
export function FormLogicPanel({ open, onClose, question, allQuestions, rules, onAdd, onUpdate, onDelete }: FormLogicPanelProps) {
  const sources = question ? allQuestions.filter((q) => q.id !== question.id && q.type !== 'section_header' && q.type !== 'rich_text') : [];
  const combinator: FormLogicCombinator = rules.some((r) => r.combinator === 'any') ? 'any' : 'all';

  const setCombinatorForAll = (next: FormLogicCombinator) => {
    for (const r of rules) onUpdate(r.id, { combinator: next });
  };

  const addCondition = () => {
    const firstSource = sources[0];
    if (!question || !firstSource) return;
    onAdd({
      targetQuestionId: question.id,
      sourceQuestionId: firstSource.id,
      comparator: 'equals',
      comparisonValue: '',
      action: 'show',
      combinator,
    });
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Question logic" size="lg">
      <div className="space-y-4">
        <p className="text-xs text-[var(--gray-400)]">{question?.title || 'Untitled question'}</p>

        {sources.length === 0 ? (
          <p className="text-sm text-[var(--gray-400)]">Add another question to this form to condition this one on its answer.</p>
        ) : rules.length === 0 ? (
          <p className="text-sm text-[var(--gray-400)]">Always visible. Add a condition to show or hide this question based on another answer.</p>
        ) : (
          <>
            {rules.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--gray-400)]">Apply</span>
                <div className="inline-flex rounded-lg border border-[var(--gray-200)] p-0.5">
                  {(['all', 'any'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setCombinatorForAll(v)}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                        combinator === v ? 'bg-[var(--primary)] text-white' : 'text-[var(--gray-500)]'
                      }`}
                    >
                      {v === 'all' ? 'All conditions' : 'Any condition'}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-3">
              {rules.map((rule) => (
                <div key={rule.id} className="rounded-xl border border-[var(--gray-100)] bg-[var(--gray-25)] p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="inline-flex rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-0.5">
                      {(['show', 'hide'] as const).map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => onUpdate(rule.id, { action: v })}
                          className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                            rule.action === v ? 'bg-[var(--primary)] text-white' : 'text-[var(--gray-500)]'
                          }`}
                        >
                          {v === 'show' ? 'Show if' : 'Hide if'}
                        </button>
                      ))}
                    </div>
                    <button type="button" onClick={() => onDelete(rule.id)} aria-label="Remove condition" className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <select
                    value={rule.sourceQuestionId}
                    onChange={(e) => onUpdate(rule.id, { sourceQuestionId: Number(e.target.value) })}
                    className="w-full rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] px-2.5 py-1.5 text-sm text-[var(--foreground)]"
                  >
                    {sources.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title || 'Untitled question'}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center gap-2">
                    <select
                      value={rule.comparator}
                      onChange={(e) => onUpdate(rule.id, { comparator: e.target.value as FormLogicComparator })}
                      className="rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] px-2.5 py-1.5 text-sm text-[var(--foreground)]"
                    >
                      {COMPARATOR_OPTIONS.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                    {needsValue(rule.comparator) && (
                      <input
                        value={typeof rule.comparisonValue === 'string' ? rule.comparisonValue : ''}
                        onChange={(e) => onUpdate(rule.id, { comparisonValue: e.target.value })}
                        placeholder="Value"
                        className="flex-1 rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] px-2.5 py-1.5 text-sm text-[var(--foreground)]"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {sources.length > 0 && (
          <Button variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={addCondition}>
            Add condition
          </Button>
        )}
      </div>
    </Modal>
  );
}
