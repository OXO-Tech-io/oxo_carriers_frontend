import { describe, it, expect, vi, beforeEach } from "vitest";
import { AxiosResponse } from "axios";
import api from "@/lib/api";
import { formService } from "@/lib/services/form.service";

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

type ApiMock = {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const apiMock = api as unknown as ApiMock;
const asResponse = <T>(data: T) => ({ data }) as AxiosResponse<T>;

describe("formService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("covers form CRUD and lifecycle actions", async () => {
    apiMock.get.mockResolvedValueOnce(asResponse({ data: [] }));
    await formService.list();
    expect(apiMock.get).toHaveBeenCalledWith("/forms");

    apiMock.post.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await formService.create({ title: "Survey" });
    expect(apiMock.post).toHaveBeenCalledWith("/forms", { title: "Survey" });

    apiMock.get.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await formService.getById(1);
    expect(apiMock.get).toHaveBeenCalledWith("/forms/1");

    apiMock.put.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await formService.update(1, { title: "Updated" });
    expect(apiMock.put).toHaveBeenCalledWith("/forms/1", { title: "Updated" });

    apiMock.delete.mockResolvedValueOnce(asResponse({}));
    await formService.remove(1);
    expect(apiMock.delete).toHaveBeenCalledWith("/forms/1");

    apiMock.post.mockResolvedValueOnce(asResponse({ data: { id: 2 } }));
    await formService.duplicate(1);
    expect(apiMock.post).toHaveBeenCalledWith("/forms/1/duplicate");

    apiMock.post.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await formService.publish(1);
    expect(apiMock.post).toHaveBeenCalledWith("/forms/1/publishes");

    apiMock.post.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await formService.unpublish(1);
    expect(apiMock.post).toHaveBeenCalledWith("/forms/1/unpublishes");

    apiMock.post.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await formService.archive(1);
    expect(apiMock.post).toHaveBeenCalledWith("/forms/1/archives");

    apiMock.post.mockResolvedValueOnce(asResponse({}));
    await formService.distribute(1, [1, 2], [3], "2026-01-01");
    expect(apiMock.post).toHaveBeenCalledWith("/forms/1/distributes", {
      userIds: [1, 2],
      groupIds: [3],
      closeAt: "2026-01-01",
    });

    apiMock.get.mockResolvedValueOnce(asResponse({ data: [] }));
    await formService.listAssignedToMe();
    expect(apiMock.get).toHaveBeenCalledWith("/forms", { params: { mine: true } });

    apiMock.get.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await formService.getMyResponse(1);
    expect(apiMock.get).toHaveBeenCalledWith("/forms/1/my-responses");
  });

  it("covers section, question and logic rule endpoints", async () => {
    apiMock.post.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await formService.createSection(1, { title: "Section 1" });
    expect(apiMock.post).toHaveBeenCalledWith("/forms/1/sections", {
      title: "Section 1",
    });

    apiMock.put.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await formService.updateSection(1, { title: "Updated" });
    expect(apiMock.put).toHaveBeenCalledWith("/forms/sections/1", {
      title: "Updated",
    });

    apiMock.delete.mockResolvedValueOnce(asResponse({}));
    await formService.deleteSection(1);
    expect(apiMock.delete).toHaveBeenCalledWith("/forms/sections/1");

    apiMock.post.mockResolvedValueOnce(asResponse({}));
    await formService.reorderSections(1, [2, 3]);
    expect(apiMock.post).toHaveBeenCalledWith("/forms/1/sections/reorder", {
      sectionIds: [2, 3],
    });

    apiMock.post.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await formService.createQuestion(1, { type: "text" } as any);
    expect(apiMock.post).toHaveBeenCalledWith("/forms/1/questions", {
      type: "text",
    });

    apiMock.put.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await formService.updateQuestion(1, { title: "Q1" });
    expect(apiMock.put).toHaveBeenCalledWith("/forms/questions/1", {
      title: "Q1",
    });

    apiMock.delete.mockResolvedValueOnce(asResponse({}));
    await formService.deleteQuestion(1);
    expect(apiMock.delete).toHaveBeenCalledWith("/forms/questions/1");

    apiMock.post.mockResolvedValueOnce(asResponse({}));
    await formService.reorderQuestions(1, [2, 3], 4);
    expect(apiMock.post).toHaveBeenCalledWith("/forms/1/questions/reorder", {
      questionIds: [2, 3],
      sectionId: 4,
    });

    apiMock.post.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await formService.createLogicRule(1, {
      targetQuestionId: 2,
      sourceQuestionId: 1,
      comparator: "equals",
    });
    expect(apiMock.post).toHaveBeenCalledWith("/forms/1/logic-rules", {
      targetQuestionId: 2,
      sourceQuestionId: 1,
      comparator: "equals",
    });

    apiMock.put.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    await formService.updateLogicRule(1, { comparator: "not_equals" });
    expect(apiMock.put).toHaveBeenCalledWith("/forms/logic-rules/1", {
      comparator: "not_equals",
    });

    apiMock.delete.mockResolvedValueOnce(asResponse({}));
    await formService.deleteLogicRule(1);
    expect(apiMock.delete).toHaveBeenCalledWith("/forms/logic-rules/1");
  });

  it("covers settings, theme, analytics and response endpoints", async () => {
    apiMock.get.mockResolvedValueOnce(asResponse({ data: { closeAt: null } }));
    await formService.getSettings(1);
    expect(apiMock.get).toHaveBeenCalledWith("/forms/1/settings");

    apiMock.put.mockResolvedValueOnce(asResponse({ data: {} }));
    await formService.updateSettings(1, { closeAt: "2026-01-01" });
    expect(apiMock.put).toHaveBeenCalledWith("/forms/1/settings", {
      closeAt: "2026-01-01",
    });

    apiMock.get.mockResolvedValueOnce(asResponse({ data: {} }));
    await formService.getTheme(1);
    expect(apiMock.get).toHaveBeenCalledWith("/forms/1/themes");

    apiMock.put.mockResolvedValueOnce(asResponse({ data: {} }));
    await formService.updateTheme(1, { primaryColor: "#fff" });
    expect(apiMock.put).toHaveBeenCalledWith("/forms/1/themes", {
      primaryColor: "#fff",
    });

    apiMock.put.mockResolvedValueOnce(asResponse({ data: {} }));
    const headerImage = new File(["x"], "header.png");
    await formService.updateTheme(1, { primaryColor: "#fff" }, headerImage);
    expect(apiMock.put).toHaveBeenCalledWith(
      "/forms/1/themes",
      expect.any(FormData),
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    const formData = apiMock.put.mock.calls[apiMock.put.mock.calls.length - 1][1] as FormData;
    expect(formData.get("primaryColor")).toBe("#fff");
    expect(formData.get("headerImage")).toBeInstanceOf(File);

    apiMock.get.mockResolvedValueOnce(asResponse({ data: {} }));
    await formService.getAnalytics(1);
    expect(apiMock.get).toHaveBeenCalledWith("/forms/1/analytics");

    apiMock.post.mockResolvedValueOnce(asResponse({}));
    await formService.submitResponse(
      1,
      [{ questionId: 1, value: "yes" } as any],
      {},
      false,
    );
    expect(apiMock.post).toHaveBeenCalledWith(
      "/forms/1/responses",
      expect.any(FormData),
      { headers: { "Content-Type": "multipart/form-data" } },
    );

    apiMock.get.mockResolvedValueOnce(asResponse({ data: [] }));
    await formService.listResponses(1);
    expect(apiMock.get).toHaveBeenCalledWith("/forms/1/responses");

    const blob = new Blob(["x"]);
    apiMock.get.mockResolvedValueOnce({ data: blob } as AxiosResponse);
    await expect(formService.downloadResponses(1, "csv")).resolves.toBe(blob);
    expect(apiMock.get).toHaveBeenCalledWith("/forms/1/responses/export", {
      params: { format: "csv" },
      responseType: "blob",
    });
  });
});
