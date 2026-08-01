import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const { formServiceMock } = vi.hoisted(() => ({
  formServiceMock: {
    getById: vi.fn(),
    update: vi.fn(),
    createSection: vi.fn(),
    updateSection: vi.fn(),
    deleteSection: vi.fn(),
    reorderSections: vi.fn(),
    createQuestion: vi.fn(),
    updateQuestion: vi.fn(),
    deleteQuestion: vi.fn(),
    reorderQuestions: vi.fn(),
    createLogicRule: vi.fn(),
    updateLogicRule: vi.fn(),
    deleteLogicRule: vi.fn(),
    publish: vi.fn(),
    unpublish: vi.fn(),
  },
}));

vi.mock("@/lib/services/form.service", () => ({ formService: formServiceMock }));

import { useFormEditor } from "@/hooks/useFormEditor";

const baseForm = {
  id: 1,
  title: "Survey",
  description: null,
  status: "draft",
  createdBy: 1,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
  publishedAt: null,
  archivedAt: null,
  responseCount: 0,
  lastResponseAt: null,
};

const section = (patch: Partial<any> = {}) => ({
  id: 10,
  formId: 1,
  title: "Section",
  description: null,
  orderIndex: 0,
  ...patch,
});

const question = (patch: Partial<any> = {}) => ({
  id: 100,
  formId: 1,
  sectionId: null,
  type: "short_answer",
  title: "Q",
  description: null,
  helpText: null,
  placeholder: null,
  required: false,
  orderIndex: 0,
  config: {},
  defaultValue: null,
  options: [],
  ...patch,
});

const rule = (patch: Partial<any> = {}) => ({
  id: 500,
  formId: 1,
  targetQuestionId: 100,
  sourceQuestionId: 101,
  comparator: "equals",
  comparisonValue: "Yes",
  action: "show",
  combinator: "all",
  orderIndex: 0,
  ...patch,
});

describe("useFormEditor", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    formServiceMock.getById.mockResolvedValue({
      form: baseForm,
      sections: [section({ id: 2, orderIndex: 1 }), section({ id: 1, orderIndex: 0 })],
      questions: [question({ id: 2, orderIndex: 1 }), question({ id: 1, orderIndex: 0 })],
      logicRules: [rule({ id: 2, orderIndex: 1 }), rule({ id: 1, orderIndex: 0 })],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // NOTE: fake timers are active for these tests (to control the 900ms debounce), which means
  // @testing-library's `waitFor` can't be used to await the initial load — its internal polling
  // relies on real timers that never tick. The mocked `formService.getById` promise resolves on
  // the microtask queue instead (unaffected by fake timers), so flushing a couple of microtasks
  // inside `act` is enough to let the effect's state updates land.
  const loadHook = async (formId: number | null = 1) => {
    const { result } = renderHook(() => useFormEditor(formId));
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(result.current.loading).toBe(false);
    return result;
  };

  it("loads the full graph and sorts sections/questions/logic rules by orderIndex", async () => {
    const result = await loadHook();
    expect(formServiceMock.getById).toHaveBeenCalledWith(1);
    expect(result.current.form).toEqual(baseForm);
    expect(result.current.sections.map((s) => s.id)).toEqual([1, 2]);
    expect(result.current.questions.map((q) => q.id)).toEqual([1, 2]);
    expect(result.current.logicRules.map((r) => r.id)).toEqual([1, 2]);
  });

  it("does not fetch when formId is null", async () => {
    const { result } = renderHook(() => useFormEditor(null));
    expect(formServiceMock.getById).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(true);
  });

  it("updateHeader schedules a debounced save that fires formService.update", async () => {
    formServiceMock.update.mockResolvedValue({ ...baseForm, title: "Updated" });
    const result = await loadHook();

    act(() => {
      result.current.updateHeader({ title: "Updated" });
    });
    expect(result.current.form?.title).toBe("Updated");
    expect(result.current.hasPendingSaves).toBe(true);
    expect(formServiceMock.update).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });
    expect(formServiceMock.update).toHaveBeenCalledWith(1, {
      title: "Updated",
      description: null,
    });
    expect(result.current.hasPendingSaves).toBe(false);
  });

  it("addSection creates via the API and appends to local state", async () => {
    const created = section({ id: 99, title: "New section" });
    formServiceMock.createSection.mockResolvedValue(created);
    const result = await loadHook();

    await act(async () => {
      await result.current.addSection();
    });
    expect(formServiceMock.createSection).toHaveBeenCalledWith(1, { title: "New section" });
    expect(result.current.sections.map((s) => s.id)).toContain(99);
  });

  it("deleteSection removes the section and unlinks its questions", async () => {
    formServiceMock.deleteSection.mockResolvedValue(undefined);
    const result = await loadHook();
    const targetSectionId = result.current.sections[0].id;

    // Attach a question to that section first.
    act(() => {
      result.current.updateQuestion(result.current.questions[0].id, { sectionId: targetSectionId });
    });

    await act(async () => {
      await result.current.deleteSection(targetSectionId);
    });
    expect(formServiceMock.deleteSection).toHaveBeenCalledWith(targetSectionId);
    expect(result.current.sections.find((s) => s.id === targetSectionId)).toBeUndefined();
    expect(
      result.current.questions.find((q) => q.sectionId === targetSectionId),
    ).toBeUndefined();
  });

  it("addQuestion builds default options for choice types and none for plain text", async () => {
    const created = question({ id: 200, type: "multiple_choice" });
    formServiceMock.createQuestion.mockResolvedValue(created);
    const result = await loadHook();

    await act(async () => {
      await result.current.addQuestion("multiple_choice", null);
    });
    expect(formServiceMock.createQuestion).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        type: "multiple_choice",
        options: [
          { label: "Option 1", value: "Option 1" },
          { label: "Option 2", value: "Option 2" },
        ],
      }),
    );
    expect(result.current.questions.map((q) => q.id)).toContain(200);
  });

  it("addQuestion builds grid config and row options for grid types", async () => {
    formServiceMock.createQuestion.mockResolvedValue(question({ id: 201, type: "multiple_choice_grid" }));
    const result = await loadHook();

    await act(async () => {
      await result.current.addQuestion("multiple_choice_grid", null);
    });
    expect(formServiceMock.createQuestion).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        config: { columns: ["Column 1", "Column 2"] },
        options: [
          { label: "Row 1", value: "Row 1" },
          { label: "Row 2", value: "Row 2" },
        ],
      }),
    );
  });

  it("updateQuestion schedules a debounced save and reconciles returned option ids", async () => {
    formServiceMock.updateQuestion.mockResolvedValue({
      options: [{ id: 555, label: "Option 1", value: "Option 1", questionId: 1, orderIndex: 0, isOther: false }],
    });
    const result = await loadHook();
    const targetId = result.current.questions[0].id;

    act(() => {
      result.current.updateQuestion(targetId, {
        title: "Updated title",
        options: [{ id: -1, label: "Option 1", value: "Option 1", questionId: 1, orderIndex: 0, isOther: false }],
      });
    });
    expect(result.current.questions.find((q) => q.id === targetId)?.title).toBe("Updated title");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(900);
    });
    expect(formServiceMock.updateQuestion).toHaveBeenCalledWith(
      targetId,
      expect.objectContaining({ title: "Updated title" }),
    );
    expect(result.current.questions.find((q) => q.id === targetId)?.options[0].id).toBe(555);
  });

  it("deleteQuestion removes the question and any logic rules referencing it", async () => {
    formServiceMock.deleteQuestion.mockResolvedValue(undefined);
    const result = await loadHook();
    const targetId = result.current.questions[0].id;

    await act(async () => {
      await result.current.deleteQuestion(targetId);
    });
    expect(formServiceMock.deleteQuestion).toHaveBeenCalledWith(targetId);
    expect(result.current.questions.find((q) => q.id === targetId)).toBeUndefined();
    expect(
      result.current.logicRules.find(
        (r) => r.targetQuestionId === targetId || r.sourceQuestionId === targetId,
      ),
    ).toBeUndefined();
  });

  it("duplicateQuestion clones an existing question via the API", async () => {
    const result = await loadHook();
    const original = result.current.questions[0];
    formServiceMock.createQuestion.mockResolvedValue(question({ id: 300, title: original.title }));

    await act(async () => {
      await result.current.duplicateQuestion(original.id);
    });
    expect(formServiceMock.createQuestion).toHaveBeenCalledWith(
      1,
      expect.objectContaining({ title: original.title, type: original.type }),
    );
    expect(result.current.questions.map((q) => q.id)).toContain(300);
  });

  it("addLogicRule creates immediately and appends to state", async () => {
    const created = rule({ id: 999 });
    formServiceMock.createLogicRule.mockResolvedValue(created);
    const result = await loadHook();

    await act(async () => {
      await result.current.addLogicRule({
        targetQuestionId: 1,
        sourceQuestionId: 2,
        comparator: "equals",
        comparisonValue: "Yes",
        action: "show",
        combinator: "all",
      });
    });
    expect(formServiceMock.createLogicRule).toHaveBeenCalled();
    expect(result.current.logicRules.map((r) => r.id)).toContain(999);
  });

  it("updateLogicRule updates local state immediately and fires the API call", async () => {
    formServiceMock.updateLogicRule.mockResolvedValue({});
    const result = await loadHook();
    const targetId = result.current.logicRules[0].id;

    act(() => {
      result.current.updateLogicRule(targetId, { comparator: "not_equals" });
    });
    expect(result.current.logicRules.find((r) => r.id === targetId)?.comparator).toBe(
      "not_equals",
    );
    expect(formServiceMock.updateLogicRule).toHaveBeenCalledWith(targetId, {
      comparator: "not_equals",
    });
  });

  it("deleteLogicRule removes the rule from state and calls the API", async () => {
    formServiceMock.deleteLogicRule.mockResolvedValue(undefined);
    const result = await loadHook();
    const targetId = result.current.logicRules[0].id;

    await act(async () => {
      await result.current.deleteLogicRule(targetId);
    });
    expect(formServiceMock.deleteLogicRule).toHaveBeenCalledWith(targetId);
    expect(result.current.logicRules.find((r) => r.id === targetId)).toBeUndefined();
  });

  it("saveNow/flushAll immediately runs pending debounced saves", async () => {
    formServiceMock.update.mockResolvedValue(baseForm);
    const result = await loadHook();

    act(() => {
      result.current.updateHeader({ title: "Flushed" });
    });
    expect(formServiceMock.update).not.toHaveBeenCalled();

    await act(async () => {
      await result.current.saveNow();
    });
    expect(formServiceMock.update).toHaveBeenCalled();
    expect(result.current.hasPendingSaves).toBe(false);
  });

  it("publish flushes pending saves first, then publishes and updates form state", async () => {
    formServiceMock.update.mockResolvedValue(baseForm);
    formServiceMock.publish.mockResolvedValue({ ...baseForm, status: "published" });
    const result = await loadHook();

    act(() => {
      result.current.updateHeader({ title: "Before publish" });
    });

    await act(async () => {
      await result.current.publish();
    });
    expect(formServiceMock.update).toHaveBeenCalled();
    expect(formServiceMock.publish).toHaveBeenCalledWith(1);
    expect(result.current.form?.status).toBe("published");
  });

  it("unpublish calls the API and updates form state", async () => {
    formServiceMock.unpublish.mockResolvedValue({ ...baseForm, status: "draft" });
    const result = await loadHook();

    await act(async () => {
      await result.current.unpublish();
    });
    expect(formServiceMock.unpublish).toHaveBeenCalledWith(1);
    expect(result.current.form?.status).toBe("draft");
  });
});
