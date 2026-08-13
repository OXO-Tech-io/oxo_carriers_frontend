import { describe, it, expect, vi, beforeEach } from "vitest";
import { AxiosResponse } from "axios";
import api from "@/lib/api";
import { documentService } from "@/lib/services/document.service";

vi.mock("@/lib/api", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

type ApiMock = {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
};

const apiMock = api as unknown as ApiMock;
const asResponse = <T>(data: T) => ({ data }) as AxiosResponse<T>;

describe("documentService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("create posts multipart form data with the individual target and files", async () => {
    apiMock.post.mockResolvedValueOnce(asResponse({ data: { id: 1 } }));
    const file = new File(["x"], "a.pdf");
    await documentService.create({
      title: "Contract",
      description: "Notes",
      targetType: "individual",
      individualEmployeeIds: [1, 2],
      files: [file],
    });

    expect(apiMock.post).toHaveBeenCalledWith(
      "/documents",
      expect.any(FormData),
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    const formData = apiMock.post.mock.calls[0][1] as FormData;
    expect(formData.get("title")).toBe("Contract");
    expect(formData.get("description")).toBe("Notes");
    expect(formData.get("targetType")).toBe("individual");
    expect(formData.get("individualEmployeeIds")).toBe(JSON.stringify([1, 2]));
    expect(formData.get("document")).toBeInstanceOf(File);
  });

  it("create omits individualEmployeeIds for an 'all' target", async () => {
    apiMock.post.mockResolvedValueOnce(asResponse({ data: { id: 2 } }));
    await documentService.create({
      title: "Policy",
      targetType: "all",
      individualEmployeeIds: [],
      files: [],
    });

    const formData = apiMock.post.mock.calls[0][1] as FormData;
    expect(formData.get("targetType")).toBe("all");
    expect(formData.get("individualEmployeeIds")).toBeNull();
  });

  it("listAll fetches the admin manage list", async () => {
    apiMock.get.mockResolvedValueOnce(asResponse({ data: [{ id: 1 }] }));
    const result = await documentService.listAll();
    expect(apiMock.get).toHaveBeenCalledWith("/documents/manage");
    expect(result).toEqual([{ id: 1 }]);
  });

  it("listMine fetches the caller's merged view", async () => {
    apiMock.get.mockResolvedValueOnce(asResponse({ data: [{ id: 2 }] }));
    const result = await documentService.listMine();
    expect(apiMock.get).toHaveBeenCalledWith("/documents");
    expect(result).toEqual([{ id: 2 }]);
  });

  it("listForEmployee fetches one employee's merged view by internal id", async () => {
    apiMock.get.mockResolvedValueOnce(asResponse({ data: [{ id: 3 }] }));
    const result = await documentService.listForEmployee(5);
    expect(apiMock.get).toHaveBeenCalledWith("/documents/employees/5");
    expect(result).toEqual([{ id: 3 }]);
  });

  it("remove deletes by id", async () => {
    apiMock.delete.mockResolvedValueOnce(asResponse(undefined));
    await documentService.remove(9);
    expect(apiMock.delete).toHaveBeenCalledWith("/documents/9");
  });
});
