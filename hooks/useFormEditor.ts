'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { formService } from '@/lib/services/form.service';
import { questionTypeUi } from '@/components/forms/questionTypes';
import type {
  FormLogicAction,
  FormLogicCombinator,
  FormLogicComparator,
  FormLogicRule,
  FormQuestion,
  FormQuestionType,
  FormSection,
  HrForm,
} from '@/types/hrModules';

const SAVE_DEBOUNCE_MS = 900;

/**
 * Central builder lifecycle: loads the form's full graph once (`GET /forms/:id`), keeps
 * sections/questions/logicRules in local state (every row always has a real DB id — "Add
 * question"/"Add section" create immediately via the API rather than tracking a temp-id/real-id
 * reconciliation), and coalesces per-field edits into a debounced save per field key (a `Map` of
 * timers keyed by e.g. `question:{id}:title`... actually keyed at the row level, see below) so fast
 * typing fires one request, not one per keystroke. `flushAll()` forces every pending save through
 * immediately — called before navigating away and on `window.beforeunload`.
 */
export function useFormEditor(formId: number | null) {
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<HrForm | null>(null);
  const [sections, setSections] = useState<FormSection[]>([]);
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [logicRules, setLogicRules] = useState<FormLogicRule[]>([]);
  const [hasPendingSaves, setHasPendingSaves] = useState(false);

  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const fns = useRef<Map<string, () => Promise<unknown>>>(new Map());
  const pendingCountRef = useRef(0);

  const setPending = useCallback((updater: (c: number) => number) => {
    pendingCountRef.current = Math.max(0, updater(pendingCountRef.current));
    setHasPendingSaves(pendingCountRef.current > 0);
  }, []);

  const schedule = useCallback(
    (key: string, fn: () => Promise<unknown>) => {
      const existingTimer = timers.current.get(key);
      if (existingTimer) clearTimeout(existingTimer);
      else setPending((c) => c + 1);
      fns.current.set(key, fn);
      timers.current.set(
        key,
        setTimeout(() => {
          timers.current.delete(key);
          const runner = fns.current.get(key);
          fns.current.delete(key);
          setPending((c) => c - 1);
          if (runner) void runner();
        }, SAVE_DEBOUNCE_MS),
      );
    },
    [setPending],
  );

  const flushAll = useCallback(async () => {
    const keys = [...fns.current.keys()];
    await Promise.all(
      keys.map(async (key) => {
        const timer = timers.current.get(key);
        if (timer) clearTimeout(timer);
        timers.current.delete(key);
        const runner = fns.current.get(key);
        fns.current.delete(key);
        if (runner) await runner();
      }),
    );
    setPending(() => 0);
  }, [setPending]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (pendingCountRef.current > 0) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const load = useCallback(async () => {
    if (formId == null) return;
    setLoading(true);
    try {
      const data = await formService.getById(formId);
      setForm(data.form);
      setSections([...data.sections].sort((a, b) => a.orderIndex - b.orderIndex));
      setQuestions([...data.questions].sort((a, b) => a.orderIndex - b.orderIndex));
      setLogicRules([...data.logicRules].sort((a, b) => a.orderIndex - b.orderIndex));
    } finally {
      setLoading(false);
    }
  }, [formId]);

  useEffect(() => {
    // Network fetch-on-mount: `load` only touches state after its internal `await`, never
    // synchronously within this effect body — a known false-positive shape for the
    // react-hooks/set-state-in-effect rule (same pattern pre-exists elsewhere in this app).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const updateHeader = useCallback(
    (patch: Partial<Pick<HrForm, 'title' | 'description'>>) => {
      setForm((prev) => {
        if (!prev) return prev;
        const next = { ...prev, ...patch };
        schedule('header', () => formService.update(next.id, { title: next.title, description: next.description }));
        return next;
      });
    },
    [schedule],
  );

  const addSection = useCallback(async () => {
    if (!form) return;
    const created = await formService.createSection(form.id, { title: 'New section' });
    setSections((prev) => [...prev, created]);
    return created;
  }, [form]);

  const updateSection = useCallback(
    (id: number, patch: Partial<Pick<FormSection, 'title' | 'description'>>) => {
      setSections((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          const next = { ...s, ...patch };
          schedule(`section:${id}`, () => formService.updateSection(id, { title: next.title, description: next.description }));
          return next;
        }),
      );
    },
    [schedule],
  );

  const deleteSection = useCallback(async (id: number) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
    setQuestions((prev) => prev.map((q) => (q.sectionId === id ? { ...q, sectionId: null } : q)));
    await formService.deleteSection(id);
  }, []);

  const reorderSections = useCallback(
    (next: FormSection[]) => {
      setSections(next.map((s, i) => ({ ...s, orderIndex: i })));
      if (form) void formService.reorderSections(form.id, next.map((s) => s.id));
    },
    [form],
  );

  const addQuestion = useCallback(
    async (type: FormQuestionType, sectionId?: number | null): Promise<FormQuestion | null> => {
      if (!form) return null;
      const ui = questionTypeUi(type);
      const isGrid = ui.configKind === 'grid';
      const created = await formService.createQuestion(form.id, {
        sectionId: sectionId ?? null,
        type,
        title: '',
        required: false,
        config: isGrid ? { columns: ['Column 1', 'Column 2'] } : undefined,
        options: ui.hasOptions
          ? [
              { label: 'Option 1', value: 'Option 1' },
              { label: 'Option 2', value: 'Option 2' },
            ]
          : isGrid
            ? [
                { label: 'Row 1', value: 'Row 1' },
                { label: 'Row 2', value: 'Row 2' },
              ]
            : [],
      });
      setQuestions((prev) => [...prev, created]);
      return created;
    },
    [form],
  );

  const updateQuestion = useCallback(
    (id: number, patch: Partial<FormQuestion> | ((current: FormQuestion) => Partial<FormQuestion>)) => {
      setQuestions((prev) =>
        prev.map((q) => {
          if (q.id !== id) return q;
          // Resolving against `q` (not a prop/closure captured at click-time) means rapid successive
          // calls — e.g. clicking "Add option" repeatedly — each build on the true latest options
          // array instead of racing on a stale one and clobbering each other's additions.
          const resolvedPatch = typeof patch === 'function' ? patch(q) : patch;
          const next = { ...q, ...resolvedPatch };
          schedule(`question:${id}`, async () => {
            const updated = await formService.updateQuestion(id, {
              sectionId: next.sectionId,
              type: next.type,
              title: next.title,
              description: next.description,
              helpText: next.helpText,
              placeholder: next.placeholder,
              required: next.required,
              config: next.config,
              defaultValue: next.defaultValue,
              options: next.options.map((o) => ({
                // Freshly-added options carry a negative local placeholder id (see QuestionEditor's
                // addOption) — sending it as a real id would make the server's update-by-id match
                // zero rows and silently drop the option instead of creating it.
                id: o.id > 0 ? o.id : undefined,
                label: o.label,
                value: o.value,
                isOther: o.isOther,
              })),
            });
            // Reconcile local placeholder ids with the server-assigned ones — options are always
            // sent and returned in the same order — so the next save doesn't re-create them.
            if (!updated.options) return;
            setQuestions((cur) =>
              cur.map((c) =>
                c.id === id
                  ? {
                      ...c,
                      options: c.options.map((o, i) => {
                        const match = updated.options[i];
                        return o.id < 0 && match ? { ...o, id: match.id } : o;
                      }),
                    }
                  : c,
              ),
            );
          });
          return next;
        }),
      );
    },
    [schedule],
  );

  const deleteQuestion = useCallback(async (id: number) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    setLogicRules((prev) => prev.filter((r) => r.targetQuestionId !== id && r.sourceQuestionId !== id));
    await formService.deleteQuestion(id);
  }, []);

  const duplicateQuestion = useCallback(
    async (id: number) => {
      const original = questions.find((q) => q.id === id);
      if (!original || !form) return;
      const created = await formService.createQuestion(form.id, {
        sectionId: original.sectionId,
        type: original.type,
        title: original.title,
        description: original.description ?? undefined,
        helpText: original.helpText ?? undefined,
        placeholder: original.placeholder ?? undefined,
        required: original.required,
        config: original.config,
        defaultValue: original.defaultValue,
        options: original.options.map((o) => ({ label: o.label, value: o.value, isOther: o.isOther })),
      });
      setQuestions((prev) => [...prev, created]);
    },
    [questions, form],
  );

  // `next` is one bucket's ordering (the ungrouped list, or one section's questions) — only those
  // ids' orderIndex change; every other question in state is left untouched (not dropped).
  const reorderQuestions = useCallback(
    (next: FormQuestion[], sectionId?: number | null) => {
      const orderById = new Map(next.map((q, i) => [q.id, i]));
      setQuestions((prev) => prev.map((q) => (orderById.has(q.id) ? { ...q, orderIndex: orderById.get(q.id) as number } : q)));
      if (form) void formService.reorderQuestions(form.id, next.map((q) => q.id), sectionId);
    },
    [form],
  );

  const addLogicRule = useCallback(
    async (params: {
      targetQuestionId: number;
      sourceQuestionId: number;
      comparator: FormLogicComparator;
      comparisonValue: unknown;
      action: FormLogicAction;
      combinator: FormLogicCombinator;
    }) => {
      if (!form) return null;
      const created = await formService.createLogicRule(form.id, params);
      setLogicRules((prev) => [...prev, created]);
      return created;
    },
    [form],
  );

  const updateLogicRule = useCallback(
    (id: number, patch: Partial<Pick<FormLogicRule, 'comparator' | 'comparisonValue' | 'action' | 'combinator' | 'sourceQuestionId'>>) => {
      setLogicRules((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
      void formService.updateLogicRule(id, patch);
    },
    [],
  );

  const deleteLogicRule = useCallback(async (id: number) => {
    setLogicRules((prev) => prev.filter((r) => r.id !== id));
    await formService.deleteLogicRule(id);
  }, []);

  const saveNow = useCallback(async () => {
    await flushAll();
  }, [flushAll]);

  const publish = useCallback(async (): Promise<HrForm | null> => {
    if (!form) return null;
    await flushAll();
    const updated = await formService.publish(form.id);
    setForm(updated);
    return updated;
  }, [form, flushAll]);

  const unpublish = useCallback(async (): Promise<HrForm | null> => {
    if (!form) return null;
    const updated = await formService.unpublish(form.id);
    setForm(updated);
    return updated;
  }, [form]);

  return {
    loading,
    form,
    sections,
    questions,
    logicRules,
    hasPendingSaves,
    updateHeader,
    addSection,
    updateSection,
    deleteSection,
    reorderSections,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    duplicateQuestion,
    reorderQuestions,
    addLogicRule,
    updateLogicRule,
    deleteLogicRule,
    saveNow,
    flushAll,
    publish,
    unpublish,
  };
}
