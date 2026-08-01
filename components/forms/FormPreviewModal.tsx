'use client';

import { Modal } from '@/components/ui';
import { QuestionField } from './QuestionField';
import type { FormQuestion, FormSection } from '@/types/hrModules';

interface FormPreviewModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string | null;
  sections: FormSection[];
  questions: FormQuestion[];
}

// Read-only render of the fill-form UI, reusing the exact same QuestionField renderer the real
// fill-form page uses — so the preview never drifts from what an employee actually sees.
export function FormPreviewModal({ open, onClose, title, description, sections, questions }: FormPreviewModalProps) {
  const ungrouped = questions.filter((q) => q.sectionId == null).sort((a, b) => a.orderIndex - b.orderIndex);
  const sortedSections = [...sections].sort((a, b) => a.orderIndex - b.orderIndex);

  const renderQuestion = (q: FormQuestion) => {
    if (q.type === 'section_header') {
      return (
        <div key={q.id} className="pt-2">
          <h3 className="text-base font-bold text-[var(--foreground)]">{q.title || 'Untitled'}</h3>
        </div>
      );
    }
    if (q.type === 'rich_text') {
      return (
        <p key={q.id} className="text-sm text-[var(--gray-400)]">
          {q.title}
        </p>
      );
    }
    return (
      <div key={q.id}>
        <label className="text-sm font-semibold text-[var(--foreground)]">
          {q.title || 'Untitled question'}
          {q.required && <span className="text-red-500"> *</span>}
        </label>
        {q.description && <p className="text-xs text-[var(--gray-400)]">{q.description}</p>}
        <QuestionField question={q} value={undefined} onChange={() => {}} disabled />
        {q.helpText && <p className="mt-1 text-xs text-[var(--gray-400)]">{q.helpText}</p>}
      </div>
    );
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Preview" size="xl">
      <div className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-[var(--foreground)]">{title || 'Untitled form'}</h2>
          {description && <p className="mt-1 text-sm text-[var(--gray-400)]">{description}</p>}
        </div>
        <div className="space-y-5">{ungrouped.map(renderQuestion)}</div>
        {sortedSections.map((section) => (
          <div key={section.id} className="space-y-5 border-t border-[var(--gray-100)] pt-5">
            <div>
              <h3 className="text-base font-bold text-[var(--foreground)]">{section.title || 'Untitled section'}</h3>
              {section.description && <p className="text-xs text-[var(--gray-400)]">{section.description}</p>}
            </div>
            {questions
              .filter((q) => q.sectionId === section.id)
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map(renderQuestion)}
          </div>
        ))}
        {ungrouped.length === 0 && sortedSections.length === 0 && (
          <p className="text-sm text-[var(--gray-400)]">No questions yet.</p>
        )}
      </div>
    </Modal>
  );
}
