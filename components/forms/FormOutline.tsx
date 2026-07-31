'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Search } from 'lucide-react';
import { questionTypeUi } from './questionTypes';
import { findBrokenLogicRules } from '@/lib/formLogic';
import type { FormLogicRule, FormQuestion, FormSection } from '@/types/hrModules';

interface FormOutlineProps {
  sections: FormSection[];
  questions: FormQuestion[];
  logicRules: FormLogicRule[];
  activeQuestionId: number | null;
  onActivate: (id: number) => void;
}

const jumpTo = (anchorId: string) => document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });

export function FormOutline({ sections, questions, logicRules, activeQuestionId, onActivate }: FormOutlineProps) {
  const [query, setQuery] = useState('');

  const answerable = questions.filter((q) => q.type !== 'section_header' && q.type !== 'rich_text');
  const untitledCount = questions.filter((q) => !q.title.trim()).length;
  const titleCounts = new Map<string, number>();
  answerable.forEach((q) => {
    const t = q.title.trim().toLowerCase();
    if (!t) return;
    titleCounts.set(t, (titleCounts.get(t) ?? 0) + 1);
  });
  const duplicateTitleCount = [...titleCounts.values()].filter((c) => c > 1).length;
  const brokenRules = useMemo(
    () => findBrokenLogicRules(logicRules, new Set(questions.map((q) => q.id))),
    [logicRules, questions],
  );

  const warnings = [
    ...(untitledCount > 0 ? [`${untitledCount} untitled question${untitledCount === 1 ? '' : 's'}`] : []),
    ...(duplicateTitleCount > 0 ? [`${duplicateTitleCount} duplicate question title${duplicateTitleCount === 1 ? '' : 's'}`] : []),
    ...(brokenRules.length > 0 ? [`${brokenRules.length} logic rule${brokenRules.length === 1 ? '' : 's'} ${brokenRules.length === 1 ? 'needs' : 'need'} attention`] : []),
  ];

  const ungrouped = questions.filter((q) => q.sectionId == null).sort((a, b) => a.orderIndex - b.orderIndex);
  const sortedSections = [...sections].sort((a, b) => a.orderIndex - b.orderIndex);

  const term = query.trim().toLowerCase();
  const matches = (title: string) => term === '' || (title || 'untitled question').toLowerCase().includes(term);

  // ~15s per question, a rough estimate matching the reference implementation's heuristic.
  const estimatedMinutes = Math.max(1, Math.round((answerable.length * 15) / 60));

  const Row = (q: FormQuestion) => {
    const ui = questionTypeUi(q.type);
    return (
      <button
        key={q.id}
        type="button"
        onClick={() => {
          onActivate(q.id);
          jumpTo(`form-question-${q.id}`);
        }}
        className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
          activeQuestionId === q.id ? 'bg-[var(--primary-light)] text-[var(--primary)] font-semibold' : 'text-[var(--gray-500)] hover:bg-[var(--gray-50)]'
        }`}
      >
        <ui.icon className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{q.title || 'Untitled question'}</span>
      </button>
    );
  };

  if (questions.length === 0) {
    return <p className="text-xs text-[var(--gray-400)]">No questions yet. Add one to see it here.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-[var(--gray-400)]">
        <span>
          {questions.length} question{questions.length === 1 ? '' : 's'}
        </span>
        <span>~{estimatedMinutes} min</span>
      </div>
      {warnings.length > 0 && (
        <div className="space-y-1">
          {warnings.map((w) => (
            <div key={w} className="flex items-center gap-1.5 text-xs text-[var(--warning-text)]">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {w}
            </div>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--gray-300)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions…"
          className="w-full rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] py-1.5 pl-8 pr-2 text-xs text-[var(--foreground)]"
        />
      </div>
      <div className="max-h-[60vh] space-y-1 overflow-y-auto">
        {ungrouped.filter((q) => matches(q.title)).map(Row)}
        {sortedSections.map((section) => {
          const sectionQuestions = questions
            .filter((q) => q.sectionId === section.id)
            .sort((a, b) => a.orderIndex - b.orderIndex)
            .filter((q) => matches(q.title));
          if (term !== '' && sectionQuestions.length === 0 && !matches(section.title)) return null;
          return (
            <div key={section.id} className="space-y-1 pt-2">
              <p className="truncate px-2.5 text-[10px] font-bold uppercase tracking-wider text-[var(--gray-300)]">
                {section.title || 'Untitled section'}
              </p>
              {sectionQuestions.map(Row)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
