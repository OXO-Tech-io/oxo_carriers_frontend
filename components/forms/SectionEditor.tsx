'use client';

import { ChevronDown, ChevronUp, GripVertical, Trash2 } from 'lucide-react';
import type { FormSection } from '@/types/hrModules';

interface SectionEditorProps {
  section: FormSection;
  dragProps: React.HTMLAttributes<HTMLDivElement>;
  onChange: (patch: Partial<Pick<FormSection, 'title' | 'description'>>) => void;
  onDelete: () => void;
  dragging?: boolean;
  dropTarget?: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

// A page-break-style grouping (form section) — distinct from the "Section header" question TYPE,
// which is inline static content within a section rather than a new group.
export function SectionEditor({
  section,
  dragProps,
  onChange,
  onDelete,
  dragging = false,
  dropTarget = false,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
}: SectionEditorProps) {
  return (
    <div
      id={`form-section-${section.id}`}
      {...dragProps}
      className={`rounded-2xl border p-4 transition-opacity ${
        dropTarget ? 'border-[var(--primary)] bg-[var(--primary-light)]' : 'border-[var(--gray-100)] bg-[var(--card-bg)]'
      } ${dragging ? 'opacity-40' : ''}`}
    >
      <div className="flex items-center gap-2 mb-3">
        <GripVertical className="h-4 w-4 cursor-grab text-[var(--gray-300)]" />
        <div className="flex flex-col">
          <button
            type="button"
            disabled={!canMoveUp}
            onClick={onMoveUp}
            aria-label="Move section up"
            className="text-[var(--gray-400)] disabled:opacity-30 hover:text-[var(--foreground)]"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={!canMoveDown}
            onClick={onMoveDown}
            aria-label="Move section down"
            className="text-[var(--gray-400)] disabled:opacity-30 hover:text-[var(--foreground)]"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--gray-400)]">Section</span>
        <div className="flex-1" />
        <button type="button" onClick={onDelete} aria-label="Delete section" className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <input
        value={section.title}
        onChange={(e) => onChange({ title: e.target.value })}
        placeholder="Section title"
        className="w-full rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-2 text-sm font-semibold text-[var(--foreground)]"
      />
      <input
        value={section.description ?? ''}
        onChange={(e) => onChange({ description: e.target.value || null })}
        placeholder="Section description (optional)"
        className="mt-2 w-full rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-2 text-xs text-[var(--foreground)]"
      />
    </div>
  );
}
