'use client';

import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { useAssignedFormsQuery, useFormQuery, useFormSettingsQuery, useFormThemeQuery, useMyFormResponseQuery } from '@/hooks/queries/use-forms-query';
import { useSubmitFormResponseMutation } from '@/hooks/mutations/use-form-mutations';
import { Button, ConfirmationDialog } from '@/components/ui';
import { Clock } from 'lucide-react';
import { QuestionField } from '@/components/forms/QuestionField';
import { AnswerView } from '@/components/forms/AnswerView';
import { isQuestionVisible } from '@/lib/formLogic';
import { resolveFileUrl } from '@/lib/constants';
import { FORM_RESPONSE_STATUS, type FormQuestion, type FormResponseAnswer } from '@/types/hrModules';

const REQUIRED_MESSAGE = 'This question is required.';
const AUTOSAVE_DEBOUNCE_MS = 1500;

// Free-text question types validated against a maxLength - distinct from
// 'checkboxes' (min/maxSelections) and 'number' (min/max), which have their
// own validation shapes below.
const TEXT_TYPES = new Set<FormQuestion['type']>(['short_answer', 'paragraph']);

const isAnswerable = (q: FormQuestion) => q.type !== 'section_header' && q.type !== 'rich_text';

const isEmpty = (q: FormQuestion, value: unknown, files: File[] | undefined, hasExistingFile: boolean): boolean => {
  if (q.type === 'file_upload') return !hasExistingFile && !(files && files.length > 0);
  if (Array.isArray(value)) return value.length === 0;
  if (value != null && typeof value === 'object') return Object.keys(value).length === 0;
  return value === undefined || value === null || value === '';
};

export default function FillFormClient() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const formId = Number(params.id);
  const wantsEdit = searchParams.get('mode') === 'edit';

  const formQuery = useFormQuery(formId);
  // Only forms actually distributed to this user may be opened here - guards against URL editing.
  const assignedQuery = useAssignedFormsQuery();
  const settingsQuery = useFormSettingsQuery(formId);
  const themeQuery = useFormThemeQuery(formId);
  const myResponseQuery = useMyFormResponseQuery(formId);
  const submitMutation = useSubmitFormResponseMutation(formId);

  const [values, setValues] = useState<Record<number, unknown>>({});
  const [files, setFiles] = useState<Record<number, File[]>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAnswered = useRef(false);
  const seededFromResponse = useRef(false);

  const questions = useMemo(() => [...(formQuery.data?.questions ?? [])].sort((a, b) => a.orderIndex - b.orderIndex), [formQuery.data]);
  const sections = useMemo(() => [...(formQuery.data?.sections ?? [])].sort((a, b) => a.orderIndex - b.orderIndex), [formQuery.data]);

  const myResponse = myResponseQuery.data?.response ?? null;
  const allowEditAfterSubmit = myResponseQuery.data?.allowEditAfterSubmit ?? false;
  const isEditingExisting = myResponse?.status === FORM_RESPONSE_STATUS.SUBMITTED && allowEditAfterSubmit && wantsEdit;

  // Seed the editable form with the recipient's previously submitted answers when they've chosen
  // to Edit (not just View) a response — once only, so it never clobbers in-progress edits on a
  // background refetch.
  useEffect(() => {
    if (!isEditingExisting || seededFromResponse.current) return;
    const answers = myResponseQuery.data?.answers ?? [];
    if (!answers.length) return;
    seededFromResponse.current = true;
    const seededValues: Record<number, unknown> = {};
    for (const a of answers) {
      if (a.value !== null && a.value !== undefined) seededValues[a.questionId] = a.value;
    }
    setValues(seededValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditingExisting, myResponseQuery.data]);

  const existingAttachmentsByQuestion = useMemo(() => {
    const map = new Map<number, { name: string; url: string }[]>();
    for (const a of myResponseQuery.data?.answers ?? []) {
      if (a.attachments?.length)
        map.set(a.questionId, a.attachments.map((att) => ({ name: att.fileName, url: resolveFileUrl(att.fileUrl) })));
    }
    return map;
  }, [myResponseQuery.data]);

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

  if (assignedQuery.isLoading) {
    return (
      <div className="mx-auto max-w-2xl py-24 text-center text-sm text-[var(--gray-400)]">Loading form…</div>
    );
  }
  if (!assignedQuery.data?.some((a) => a.form.id === formId)) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-[var(--gray-100)] bg-[var(--card-bg)] p-10 text-center space-y-4">
        <p className="text-sm font-semibold text-red-500">This form was not assigned to you.</p>
        <Button variant="outline" onClick={() => router.push('/my-forms')}>
          Back to My Forms
        </Button>
      </div>
    );
  }

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
  const alreadySubmittedLocked = myResponse?.status === FORM_RESPONSE_STATUS.SUBMITTED && !isEditingExisting;

  if (alreadySubmittedLocked) {
    const answers = myResponseQuery.data?.answers ?? [];
    const allQuestions = [...(formQuery.data.questions ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);
    const allSections = [...(formQuery.data.sections ?? [])].sort((a, b) => a.orderIndex - b.orderIndex);
    const renderReadOnly = (q: FormQuestion) => {
      if (!isAnswerable(q)) return null;
      return (
        <div key={q.id} className="rounded-2xl border border-[var(--gray-100)] bg-[var(--card-bg)] p-5 shadow-sm sm:p-6">
          <p className="text-sm font-semibold text-[var(--foreground)]">{q.title || 'Untitled question'}</p>
          <div className="mt-1">
            <AnswerView question={q} answer={answers.find((a) => a.questionId === q.id)} />
          </div>
        </div>
      );
    };
    const primaryColor = themeQuery.data?.primaryColor;
    return (
      <div
        className="mx-auto max-w-2xl animate-fade-in space-y-4 pb-10"
        style={primaryColor ? ({ '--primary': primaryColor, '--primary-light': `${primaryColor}1a` } as CSSProperties) : undefined}
      >
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

        <div className="flex justify-start gap-2 pt-2">
          <Button variant="outline" onClick={() => router.push('/my-forms')}>
            Back to My Forms
          </Button>
          {allowEditAfterSubmit && (
            <Button onClick={() => router.push(`/my-forms/${formId}?mode=edit`)}>Edit response</Button>
          )}
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

  const setQuestionFiles = (id: number, selected: File[]) => {
    hasAnswered.current = true;
    setFiles((prev) => {
      const next = { ...prev };
      if (selected.length) next[id] = selected;
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

  const validate = (): Record<number, string> => {
    const nextErrors: Record<number, string> = {};
    questions.forEach((q) => {
      if (!isAnswerable(q) || !visibleIds.has(q.id)) return;
      const value = values[q.id];
      const hasExistingFile = existingAttachmentsByQuestion.has(q.id) && !files[q.id];
      const empty = isEmpty(q, value, files[q.id], hasExistingFile);
      if (q.required && empty) {
        nextErrors[q.id] = REQUIRED_MESSAGE;
        return;
      }
      if (empty) return;

      const config = q.config;
      if (q.type === 'number') {
        const n = Number(value);
        const min = typeof config['min'] === 'number' ? (config['min'] as number) : undefined;
        const max = typeof config['max'] === 'number' ? (config['max'] as number) : undefined;
        if (Number.isNaN(n) || (min !== undefined && n < min) || (max !== undefined && n > max)) {
          nextErrors[q.id] = `Must be between ${min ?? '-∞'} and ${max ?? '∞'}.`;
        }
      } else if (q.type === 'checkboxes') {
        const selections = Array.isArray(value) ? value : [];
        const minSelections =
          typeof config['minSelections'] === 'number' && (config['minSelections'] as number) > 0 ? (config['minSelections'] as number) : undefined;
        const maxSelections =
          typeof config['maxSelections'] === 'number' && (config['maxSelections'] as number) > 0 ? (config['maxSelections'] as number) : undefined;
        if (minSelections && selections.length < minSelections) {
          nextErrors[q.id] = `Select at least ${minSelections}.`;
        } else if (maxSelections && selections.length > maxSelections) {
          nextErrors[q.id] = `Select at most ${maxSelections}.`;
        }
      } else if (TEXT_TYPES.has(q.type)) {
        const maxLength =
          typeof config['maxLength'] === 'number' && (config['maxLength'] as number) > 0 ? (config['maxLength'] as number) : undefined;
        if (maxLength && String(value).length > maxLength) {
          nextErrors[q.id] = `Must be ${maxLength} characters or fewer.`;
        }
      }
    });
    setErrors(nextErrors);
    return nextErrors;
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    const validationErrors = validate();
    const messages = Object.values(validationErrors);
    if (messages.length > 0) {
      // Only call out "required" when a required question is actually unanswered -
      // out-of-range / length / selection errors are a different problem.
      const hasMissingRequired = messages.some((m) => m === REQUIRED_MESSAGE);
      setSubmitError(
        hasMissingRequired
          ? 'Please answer all required questions before submitting.'
          : 'Please correct the highlighted answers before submitting.',
      );
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

  const handleCancelEdit = () => {
    if (hasAnswered.current) {
      setShowCancelConfirm(true);
      return;
    }
    router.push(`/my-forms/${formId}`);
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
          files={files[q.id]}
          existingFiles={files[q.id] ? [] : (existingAttachmentsByQuestion.get(q.id) ?? [])}
          onFilesChange={(selected) => setQuestionFiles(q.id, selected)}
        />
        {q.helpText && <p className="mt-1 text-xs text-[var(--gray-400)]">{q.helpText}</p>}
        {errors[q.id] && <p className="mt-1 text-xs font-medium text-red-500">{errors[q.id]}</p>}
      </div>
    );
  };

  const ungrouped = questions.filter((q) => q.sectionId == null);
  const hasRequired = questions.some((q) => isAnswerable(q) && q.required);

  const primaryColor = themeQuery.data?.primaryColor;

  return (
    <div
      className="mx-auto max-w-2xl animate-fade-in space-y-4 pb-10"
      style={primaryColor ? ({ '--primary': primaryColor, '--primary-light': `${primaryColor}1a` } as CSSProperties) : undefined}
    >
      {themeQuery.data?.headerImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={resolveFileUrl(themeQuery.data.headerImageUrl)} alt="" className="h-32 w-full rounded-2xl object-cover" />
      )}
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

      <div className="flex justify-end gap-2 pt-2">
        {isEditingExisting && (
          <Button variant="outline" onClick={handleCancelEdit}>
            Cancel
          </Button>
        )}
        <Button onClick={handleSubmit} isLoading={submitMutation.isPending}>
          Submit
        </Button>
      </div>

      <ConfirmationDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => router.push(`/my-forms/${formId}`)}
        title="Discard changes?"
        message="You have unsaved changes to this response. Leaving now will discard them."
        confirmLabel="Discard changes"
        variant="danger"
      />
    </div>
  );
}
