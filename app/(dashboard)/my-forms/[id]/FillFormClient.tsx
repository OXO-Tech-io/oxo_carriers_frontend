'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFormQuery, useFormSettingsQuery, useMyFormResponseQuery } from '@/hooks/queries/use-forms-query';
import { useSubmitFormResponseMutation } from '@/hooks/mutations/use-form-mutations';
import { Button } from '@/components/ui';
import { Clock } from 'lucide-react';
import { QuestionField } from '@/components/forms/QuestionField';
import { isQuestionVisible } from '@/lib/formLogic';
import type { FormQuestion, FormResponseAnswer } from '@/types/hrModules';

const AUTOSAVE_DEBOUNCE_MS = 1500;

const isAnswerable = (q: FormQuestion) => q.type !== 'section_header' && q.type !== 'rich_text';

const isEmpty = (q: FormQuestion, value: unknown, file: File | undefined): boolean => {
  if (q.type === 'file_upload') return !file;
  if (Array.isArray(value)) return value.length === 0;
  if (value != null && typeof value === 'object') return Object.keys(value).length === 0;
  return value === undefined || value === null || value === '';
};

const answerDisplay = (answer: FormResponseAnswer | undefined): string => {
  if (!answer) return '—';
  if (answer.valueText) return answer.valueText;
  if (answer.value == null || answer.value === '') return '—';
  if (Array.isArray(answer.value)) return answer.value.join(', ');
  if (typeof answer.value === 'object') return JSON.stringify(answer.value);
  return String(answer.value);
};

export default function FillFormClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const formId = Number(params.id);

  const formQuery = useFormQuery(formId);
  const settingsQuery = useFormSettingsQuery(formId);
  const myResponseQuery = useMyFormResponseQuery(formId);
  const submitMutation = useSubmitFormResponseMutation(formId);

  const [values, setValues] = useState<Record<number, unknown>>({});
  const [files, setFiles] = useState<Record<number, File>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAnswered = useRef(false);

  const questions = useMemo(() => [...(formQuery.data?.questions ?? [])].sort((a, b) => a.orderIndex - b.orderIndex), [formQuery.data]);
  const sections = useMemo(() => [...(formQuery.data?.sections ?? [])].sort((a, b) => a.orderIndex - b.orderIndex), [formQuery.data]);

  const visibleIds = useMemo(() => {
    const logicRules = formQuery.data?.logicRules ?? [];
    const set = new Set<number>();
    questions.forEach((q) => {
      if (isQuestionVisible(q.id, logicRules, values)) set.add(q.id);
    });
    return set;
  }, [questions, formQuery.data, values]);

  const buildAnswers = () =>
    questions
      .filter((q) => isAnswerable(q) && visibleIds.has(q.id) && q.type !== 'file_upload')
      .map((q) => ({ questionId: q.id, value: values[q.id] }));

  // Debounced autosave (draft, `final: false`) — reuses the same submit endpoint as the real
  // submission, just without the server-side required/logic validation that `final: true` triggers.
  useEffect(() => {
    if (!hasAnswered.current) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      void submitMutation.mutateAsync({ answers: buildAnswers(), files, final: false }).catch(() => {
        // Autosave failures are silent — the final submit still validates and surfaces errors.
      });
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, files]);

  if (formQuery.isLoading || myResponseQuery.isLoading) {
    return (
      <div className="mx-auto max-w-2xl py-24 text-center text-sm text-[var(--gray-400)]">Loading form…</div>
    );
  }
  if (!formQuery.data) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-[var(--gray-100)] bg-[var(--card-bg)] p-10 text-center">
        <p className="text-sm font-semibold text-red-500">Form not found</p>
      </div>
    );
  }

  const { form } = formQuery.data;
  const myResponse = myResponseQuery.data?.response ?? null;
  const alreadySubmittedLocked = myResponse?.status === 'submitted' && !myResponseQuery.data?.allowEditAfterSubmit;

  if (alreadySubmittedLocked) {
    const answers = myResponseQuery.data?.answers ?? [];
    const allQuestions = [...(formQuery.data.questions ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);
    const allSections = [...(formQuery.data.sections ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);
    const renderReadOnly = (q: FormQuestion) => {
      if (!isAnswerable(q)) return null;
      return (
        <div key={q.id} className="rounded-2xl border border-[var(--gray-100)] bg-[var(--card-bg)] p-5 shadow-sm sm:p-6">
          <p className="text-sm font-semibold text-[var(--foreground)]">{q.title || 'Untitled question'}</p>
          <p className="mt-1 text-sm text-[var(--gray-400)]">{answerDisplay(answers.find((a) => a.questionId === q.id))}</p>
        </div>
      );
    };
    return (
      <div className="mx-auto max-w-2xl animate-fade-in space-y-4 pb-10">
        <div className="overflow-hidden rounded-2xl border border-[var(--gray-100)] bg-[var(--card-bg)] shadow-sm">
          <div className="h-2.5 bg-emerald-500" />
          <div className="space-y-2 p-6">
            <h1 className="text-2xl font-bold text-[var(--foreground)] sm:text-3xl">{form.title}</h1>
            <p className="text-sm font-medium text-emerald-600">
              You already submitted this form
              {myResponse?.submittedAt ? ` on ${new Date(myResponse.submittedAt).toLocaleString()}` : ''}.
            </p>
          </div>
        </div>

        <div className="space-y-4">{allQuestions.filter((q) => q.sectionId == null).map(renderReadOnly)}</div>

        {allSections.map((section) => (
          <div key={section.id} className="space-y-4">
            <div className="rounded-2xl border-l-4 border-[var(--primary)] bg-[var(--primary-light)] p-5">
              <h2 className="text-lg font-bold text-[var(--foreground)]">{section.title || 'Untitled section'}</h2>
            </div>
            <div className="space-y-4">{allQuestions.filter((q) => q.sectionId === section.id).map(renderReadOnly)}</div>
          </div>
        ))}

        <div className="flex justify-start pt-2">
          <Button variant="outline" onClick={() => router.push('/my-forms')}>
            Back to My Forms
          </Button>
        </div>
      </div>
    );
  }

  const setValue = (id: number, value: unknown) => {
    hasAnswered.current = true;
    setValues((prev) => ({ ...prev, [id]: value }));
    setErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const setFile = (id: number, file: File | null) => {
    hasAnswered.current = true;
    setFiles((prev) => {
      const next = { ...prev };
      if (file) next[id] = file;
      else delete next[id];
      return next;
    });
    setErrors((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  const validate = (): boolean => {
    const nextErrors: Record<number, string> = {};
    questions.forEach((q) => {
      if (!isAnswerable(q) || !visibleIds.has(q.id) || !q.required) return;
      if (isEmpty(q, values[q.id], files[q.id])) nextErrors[q.id] = 'This question is required.';
    });
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    if (!validate()) {
      setSubmitError('Please answer all required questions before submitting.');
      return;
    }
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    try {
      await submitMutation.mutateAsync({ answers: buildAnswers(), files, final: true });
      router.push('/my-forms');
    } catch {
      setSubmitError('Could not submit this form. It may be closed or you may have already submitted a response.');
    }
  };

  const renderQuestion = (q: FormQuestion) => {
    if (!visibleIds.has(q.id)) return null;

    if (q.type === 'section_header') {
      return (
        <h3 key={q.id} className="px-1 pt-2 text-base font-bold text-[var(--foreground)]">
          {q.title || 'Untitled'}
        </h3>
      );
    }
    if (q.type === 'rich_text') {
      return (
        <p key={q.id} className="px-1 text-sm text-[var(--gray-400)]">
          {q.title}
        </p>
      );
    }

    return (
      <div
        key={q.id}
        className="rounded-2xl border border-[var(--gray-100)] bg-[var(--card-bg)] p-5 shadow-sm transition-colors focus-within:border-[var(--primary)] sm:p-6"
      >
        <label className="text-sm font-semibold text-[var(--foreground)]">
          {q.title || 'Untitled question'}
          {q.required && <span className="text-red-500"> *</span>}
        </label>
        {q.description && <p className="mt-0.5 text-xs text-[var(--gray-400)]">{q.description}</p>}
        <QuestionField
          question={q}
          value={values[q.id]}
          onChange={(value) => setValue(q.id, value)}
          file={files[q.id]}
          onFileChange={(file) => setFile(q.id, file)}
        />
        {q.helpText && <p className="mt-1 text-xs text-[var(--gray-400)]">{q.helpText}</p>}
        {errors[q.id] && <p className="mt-1 text-xs font-medium text-red-500">{errors[q.id]}</p>}
      </div>
    );
  };

  const ungrouped = questions.filter((q) => q.sectionId == null);
  const hasRequired = questions.some((q) => isAnswerable(q) && q.required);

  return (
    <div className="mx-auto max-w-2xl animate-fade-in space-y-4 pb-10">
      <div className="overflow-hidden rounded-2xl border border-[var(--gray-100)] bg-[var(--card-bg)] shadow-sm">
        <div className="h-2.5 bg-[var(--primary)]" />
        <div className="space-y-2 p-6">
          <h1 className="text-2xl font-bold text-[var(--foreground)] sm:text-3xl">{form.title}</h1>
          {form.description && <p className="whitespace-pre-line text-sm text-[var(--gray-400)]">{form.description}</p>}
          {settingsQuery.data?.closeAt && (
            <p className={`text-xs font-medium flex items-center gap-1.5 pt-1 ${new Date() > new Date(settingsQuery.data.closeAt) ? 'text-amber-600 dark:text-amber-400' : 'text-amber-600 dark:text-amber-400'}`}>
              <Clock className="h-3.5 w-3.5" />
              Submission Deadline: {new Date(settingsQuery.data.closeAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
              {new Date() > new Date(settingsQuery.data.closeAt) && ' (Overdue — submission will be marked as late)'}
            </p>
          )}
          {hasRequired && <p className="pt-1 text-xs text-red-500">* Indicates a required question</p>}
        </div>
      </div>

      <div className="space-y-4">{ungrouped.map(renderQuestion)}</div>

      {sections.map((section) => (
        <div key={section.id} className="space-y-4">
          <div className="rounded-2xl border-l-4 border-[var(--primary)] bg-[var(--primary-light)] p-5">
            <h2 className="text-lg font-bold text-[var(--foreground)]">{section.title || 'Untitled section'}</h2>
            {section.description && <p className="mt-0.5 text-sm text-[var(--gray-400)]">{section.description}</p>}
          </div>
          <div className="space-y-4">{questions.filter((q) => q.sectionId === section.id).map(renderQuestion)}</div>
        </div>
      ))}

      {submitError && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{submitError}</p>
      )}

      <div className="flex justify-end pt-2">
        <Button onClick={handleSubmit} isLoading={submitMutation.isPending}>
          Submit
        </Button>
      </div>
    </div>
  );
}
