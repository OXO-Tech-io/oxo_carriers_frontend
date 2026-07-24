'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { useFormEditor } from '@/hooks/useFormEditor';
import { useDragReorder } from '@/hooks/useDragReorder';
import { Button } from '@/components/ui';
import { QuestionEditor } from '@/components/forms/QuestionEditor';
import { SectionEditor } from '@/components/forms/SectionEditor';
import { QuestionTypePicker } from '@/components/forms/QuestionTypePicker';
import { FormOutline } from '@/components/forms/FormOutline';
import { FormLogicPanel } from '@/components/forms/FormLogicPanel';
import { FormPreviewModal } from '@/components/forms/FormPreviewModal';
import type { FormQuestion, FormSection } from '@/types/hrModules';

function QuestionsList({
  questions,
  sectionId,
  sections,
  activeQuestionId,
  onActivate,
  onChange,
  onDuplicate,
  onDelete,
  onOpenLogic,
  ruleCountFor,
  onReorder,
}: {
  questions: FormQuestion[];
  sectionId: number | null;
  sections: FormSection[];
  activeQuestionId: number | null;
  onActivate: (id: number) => void;
  onChange: (id: number, patch: Partial<FormQuestion> | ((current: FormQuestion) => Partial<FormQuestion>)) => void;
  onDuplicate: (id: number) => void;
  onDelete: (id: number) => void;
  onOpenLogic: (q: FormQuestion) => void;
  ruleCountFor: (id: number) => number;
  onReorder: (next: FormQuestion[], sectionId: number | null) => void;
}) {
  const list = useMemo(
    () => questions.filter((q) => q.sectionId === sectionId).sort((a, b) => a.orderIndex - b.orderIndex),
    [questions, sectionId],
  );
  const drag = useDragReorder(list, (next) => onReorder(next, sectionId));

  if (list.length === 0) return null;

  return (
    <div className="space-y-3">
      {list.map((q, idx) => (
        <QuestionEditor
          key={q.id}
          question={q}
          sections={sections}
          dragProps={drag.dragProps(idx)}
          onChange={(patch) => onChange(q.id, patch)}
          onDuplicate={() => onDuplicate(q.id)}
          onDelete={() => onDelete(q.id)}
          onOpenLogic={() => onOpenLogic(q)}
          logicRuleCount={ruleCountFor(q.id)}
          active={activeQuestionId === q.id}
          onActivate={() => onActivate(q.id)}
          dragging={drag.isDragging(idx)}
          dropTarget={drag.isDropTarget(idx)}
          canMoveUp={drag.canMoveUp(idx)}
          canMoveDown={drag.canMoveDown(idx)}
          onMoveUp={() => drag.moveUp(idx)}
          onMoveDown={() => drag.moveDown(idx)}
        />
      ))}
    </div>
  );
}

export default function EditFormClient() {
  const params = useParams<{ id: string }>();
  const formId = Number(params.id);
  const { isHR, isSuperAdmin } = useAuth();
  const toast = useToast();

  const editor = useFormEditor(formId || null);
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);
  const [targetSectionId, setTargetSectionId] = useState<number | null>(null);
  const [logicQuestion, setLogicQuestion] = useState<FormQuestion | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Re-entrancy guards - a double-click used to fire two concurrent create requests that both
  // computed the same next orderIndex server-side, leaving one section/question's position
  // ambiguous until reload (it was never actually missing, just sorted unpredictably).
  const addingSectionRef = useRef(false);
  const addingQuestionRef = useRef(false);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());

  useEffect(() => {
    return () => {
      void editor.flushAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sortedSections = useMemo(() => [...editor.sections].sort((a, b) => a.orderIndex - b.orderIndex), [editor.sections]);
  const sectionDrag = useDragReorder(sortedSections, editor.reorderSections);

  if (!isHR && !isSuperAdmin) {
    return <p className="text-sm text-[var(--gray-400)]">You do not have access to this page.</p>;
  }

  if (editor.loading || !editor.form) {
    return (
      <div className="flex items-center justify-center py-24 text-[var(--gray-400)]">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const { form } = editor;
  const ruleCountFor = (questionId: number) => editor.logicRules.filter((r) => r.targetQuestionId === questionId).length;

  const scrollRowIntoView = (key: string) => {
    requestAnimationFrame(() => rowRefs.current.get(key)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };

  const handleAddQuestion = async (type: FormQuestion['type']) => {
    if (addingQuestionRef.current) return;
    addingQuestionRef.current = true;
    try {
      const created = await editor.addQuestion(type, targetSectionId);
      if (created) setActiveQuestionId(created.id);
    } finally {
      addingQuestionRef.current = false;
    }
  };

  const handleAddSection = async () => {
    if (addingSectionRef.current) return;
    addingSectionRef.current = true;
    try {
      const created = await editor.addSection();
      if (created) {
        setTargetSectionId(created.id);
        scrollRowIntoView(`section-${created.id}`);
      }
    } finally {
      addingSectionRef.current = false;
    }
  };

  const handlePublishToggle = async () => {
    if (form.status === 'published') {
      setPublishing(true);
      try {
        await editor.flushAll();
        await editor.unpublish();
        toast.success('Form unpublished', 'It is no longer visible to employees.');
      } catch {
        toast.error('Could not unpublish form');
      } finally {
        setPublishing(false);
      }
      return;
    }
    if (editor.questions.length === 0) {
      toast.error('Add at least one question before publishing');
      return;
    }
    setPublishing(true);
    try {
      await editor.publish();
      toast.success('Form published', 'Employees you distribute it to can now fill it out.');
    } catch {
      toast.error('Could not publish form');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/forms" className="flex items-center gap-1.5 text-sm font-semibold text-[var(--gray-400)] hover:text-[var(--foreground)]">
          <ArrowLeft className="h-4 w-4" /> Forms
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-[var(--gray-400)]">
            {editor.hasPendingSaves ? 'Saving…' : 'Saved'}
          </span>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              form.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-[var(--gray-100)] text-[var(--gray-400)]'
            }`}
          >
            {form.status}
          </span>
          <Link href={`/admin/forms/${form.id}/settings`} className="text-sm font-semibold text-[var(--primary)] hover:underline">
            Settings
          </Link>
          <Link href={`/admin/forms/${form.id}/analytics`} className="text-sm font-semibold text-[var(--primary)] hover:underline">
            Analytics
          </Link>
          <Link href={`/admin/forms/${form.id}/responses`} className="text-sm font-semibold text-[var(--primary)] hover:underline">
            Responses
          </Link>
          <Button variant="outline" size="sm" leftIcon={<Eye className="h-4 w-4" />} onClick={() => setPreviewOpen(true)}>
            Preview
          </Button>
          <Button size="sm" variant={form.status === 'published' ? 'outline' : 'primary'} isLoading={publishing} onClick={handlePublishToggle}>
            {form.status === 'published' ? 'Unpublish' : 'Publish'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr_240px]">
        <aside className="hidden lg:block">
          <div className="sticky top-4 rounded-2xl border border-[var(--gray-100)] bg-[var(--card-bg)] p-4">
            <FormOutline
              sections={editor.sections}
              questions={editor.questions}
              logicRules={editor.logicRules}
              activeQuestionId={activeQuestionId}
              onActivate={setActiveQuestionId}
            />
          </div>
        </aside>

        <main className="space-y-4">
          <div className="rounded-2xl border-t-4 border-[var(--primary)] border border-[var(--gray-100)] bg-[var(--card-bg)] p-5 space-y-3">
            <input
              value={form.title}
              onChange={(e) => editor.updateHeader({ title: e.target.value })}
              placeholder="Untitled form"
              className="w-full border-none bg-transparent p-0 text-2xl font-bold text-[var(--foreground)] focus:outline-none"
            />
            <textarea
              value={form.description ?? ''}
              onChange={(e) => editor.updateHeader({ description: e.target.value || null })}
              placeholder="Form description"
              rows={2}
              className="w-full border-none bg-transparent p-0 text-sm text-[var(--gray-400)] focus:outline-none resize-none"
            />
          </div>

          <QuestionsList
            questions={editor.questions}
            sectionId={null}
            sections={editor.sections}
            activeQuestionId={activeQuestionId}
            onActivate={setActiveQuestionId}
            onChange={editor.updateQuestion}
            onDuplicate={editor.duplicateQuestion}
            onDelete={editor.deleteQuestion}
            onOpenLogic={setLogicQuestion}
            ruleCountFor={ruleCountFor}
            onReorder={editor.reorderQuestions}
          />

          {sortedSections.map((section, idx) => (
            <div
              key={section.id}
              ref={(el) => {
                if (el) rowRefs.current.set(`section-${section.id}`, el);
                else rowRefs.current.delete(`section-${section.id}`);
              }}
              className="space-y-3"
            >
              <SectionEditor
                section={section}
                dragProps={sectionDrag.dragProps(idx)}
                onChange={(patch) => editor.updateSection(section.id, patch)}
                onDelete={() => editor.deleteSection(section.id)}
                dragging={sectionDrag.isDragging(idx)}
                dropTarget={sectionDrag.isDropTarget(idx)}
                canMoveUp={sectionDrag.canMoveUp(idx)}
                canMoveDown={sectionDrag.canMoveDown(idx)}
                onMoveUp={() => sectionDrag.moveUp(idx)}
                onMoveDown={() => sectionDrag.moveDown(idx)}
              />
              <div className="pl-4">
                <QuestionsList
                  questions={editor.questions}
                  sectionId={section.id}
                  sections={editor.sections}
                  activeQuestionId={activeQuestionId}
                  onActivate={setActiveQuestionId}
                  onChange={editor.updateQuestion}
                  onDuplicate={editor.duplicateQuestion}
                  onDelete={editor.deleteQuestion}
                  onOpenLogic={setLogicQuestion}
                  ruleCountFor={ruleCountFor}
                  onReorder={editor.reorderQuestions}
                />
              </div>
            </div>
          ))}

          {editor.questions.length === 0 && editor.sections.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[var(--gray-200)] bg-[var(--gray-25)] p-10 text-center">
              <p className="text-sm font-semibold text-[var(--foreground)]">No questions yet</p>
              <p className="mt-1 text-xs text-[var(--gray-400)]">Use the panel on the right to add your first question.</p>
            </div>
          )}
        </main>

        <aside className="hidden lg:block">
          <div className="sticky top-4 space-y-4 rounded-2xl border border-[var(--gray-100)] bg-[var(--card-bg)] p-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-[var(--gray-400)]">Add question to</label>
              <select
                value={targetSectionId ?? ''}
                onChange={(e) => setTargetSectionId(e.target.value ? Number(e.target.value) : null)}
                className="mt-1 w-full rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] px-2 py-1.5 text-xs text-[var(--foreground)]"
              >
                <option value="">No section (top)</option>
                {sortedSections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title || 'Untitled section'}
                  </option>
                ))}
              </select>
            </div>
            <QuestionTypePicker onPick={handleAddQuestion} onAddSection={handleAddSection} />
          </div>
        </aside>
      </div>

      <FormLogicPanel
        open={!!logicQuestion}
        onClose={() => setLogicQuestion(null)}
        question={logicQuestion}
        allQuestions={editor.questions}
        rules={logicQuestion ? editor.logicRules.filter((r) => r.targetQuestionId === logicQuestion.id) : []}
        onAdd={(params) => void editor.addLogicRule(params)}
        onUpdate={editor.updateLogicRule}
        onDelete={editor.deleteLogicRule}
      />

      <FormPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={form.title}
        description={form.description}
        sections={editor.sections}
        questions={editor.questions}
      />
    </div>
  );
}
