'use client';

import { Layers } from 'lucide-react';
import { QUESTION_TYPES, QUESTION_TYPE_GROUPS } from './questionTypes';
import type { FormQuestionType } from '@/types/hrModules';

interface QuestionTypePickerProps {
  onPick: (type: FormQuestionType) => void;
  onAddSection: () => void;
}

// Persistent "Add question" rail — all 19 types grouped by category (unlike the reference
// implementation this was ported from, which only shipped 10 live and commented out the rest).
export function QuestionTypePicker({ onPick, onAddSection }: QuestionTypePickerProps) {
  return (
    <div className="space-y-5">
      {QUESTION_TYPE_GROUPS.filter((g) => g !== 'Layout').map((group) => (
        <div key={group} className="space-y-2">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--gray-400)]">{group}</h4>
          <div className="space-y-1">
            {QUESTION_TYPES.filter((t) => t.group === group).map((t) => (
              <button
                key={t.type}
                type="button"
                onClick={() => onPick(t.type)}
                className="flex w-full items-center gap-2 rounded-xl border border-[var(--gray-100)] px-3 py-2 text-left text-sm text-[var(--foreground)] transition-colors hover:border-[var(--primary)] hover:bg-[var(--primary-light)]"
              >
                <t.icon className="h-4 w-4 shrink-0 text-[var(--gray-400)]" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="space-y-2">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-[var(--gray-400)]">Layout</h4>
        <div className="space-y-1">
          {QUESTION_TYPES.filter((t) => t.group === 'Layout').map((t) => (
            <button
              key={t.type}
              type="button"
              onClick={() => onPick(t.type)}
              className="flex w-full items-center gap-2 rounded-xl border border-[var(--gray-100)] px-3 py-2 text-left text-sm text-[var(--foreground)] transition-colors hover:border-[var(--primary)] hover:bg-[var(--primary-light)]"
            >
              <t.icon className="h-4 w-4 shrink-0 text-[var(--gray-400)]" />
              {t.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onAddSection}
            className="flex w-full items-center gap-2 rounded-xl border border-dashed border-[var(--gray-200)] px-3 py-2 text-left text-sm text-[var(--gray-400)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
          >
            <Layers className="h-4 w-4 shrink-0" />
            New section (page break)
          </button>
        </div>
      </div>
    </div>
  );
}
