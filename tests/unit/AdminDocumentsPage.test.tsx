import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import AdminDocumentsPage from "@/app/admin/documents/page";
import type { VaultDocument } from "@/types/hrModules";

const {
  useMyPermissionLevelMock,
  useManageDocumentsQueryMock,
  createMutateAsyncMock,
  deleteMutateAsyncMock,
  userDirectoryServiceMock,
} = vi.hoisted(() => ({
  useMyPermissionLevelMock: vi.fn(),
  useManageDocumentsQueryMock: vi.fn(),
  createMutateAsyncMock: vi.fn(),
  deleteMutateAsyncMock: vi.fn(),
  userDirectoryServiceMock: { list: vi.fn() },
}));

vi.mock("@/hooks/useMyPermissionLevel", () => ({ useMyPermissionLevel: useMyPermissionLevelMock }));
vi.mock("@/hooks/queries/use-documents-query", () => ({
  useManageDocumentsQuery: useManageDocumentsQueryMock,
}));
vi.mock("@/hooks/mutations/use-document-mutations", () => ({
  useCreateDocumentMutation: () => ({ mutateAsync: createMutateAsyncMock, isPending: false }),
  useDeleteDocumentMutation: () => ({ mutateAsync: deleteMutateAsyncMock, isPending: false }),
}));
vi.mock("@/lib/services/user-directory.service", () => ({
  userDirectoryService: userDirectoryServiceMock,
}));

function makeDoc(overrides: Partial<VaultDocument> = {}): VaultDocument {
  return {
    id: 1,
    title: "Employment Contract",
    description: "Signed copy",
    targetType: "individual",
    createdBy: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    version: "1.0",
    isMandatoryViewing: false,
    recipientEmployeeIds: ["7"],
    attachments: [{ id: 10, entityType: "document", entityId: 1, fileUrl: "/uploads/documents/contract.pdf", fileName: "contract.pdf", mimeType: null, fileSize: null, uploadedBy: null, createdAt: "2026-01-01T00:00:00.000Z" }],
    ...overrides,
  };
}

const paged = (items: VaultDocument[]) => ({ items, total: items.length, page: 1, pageSize: 10 });

describe("AdminDocumentsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userDirectoryServiceMock.list.mockResolvedValue([]);
    // Default: a user holding document_vault 'write' (Super Admin by default).
    useMyPermissionLevelMock.mockReturnValue({ allowed: true, loaded: true });
    useManageDocumentsQueryMock.mockReturnValue({ data: paged([makeDoc()]), isLoading: false });
  });

  it("denies access without document_vault write (HR Manager / HR Executive only get read)", () => {
    useMyPermissionLevelMock.mockReturnValue({ allowed: false, loaded: true });
    render(<AdminDocumentsPage />);
    expect(screen.getByText("You do not have access to this page.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Upload Document" })).not.toBeInTheDocument();
    // The list query must not fire for a user who can't use the page.
    expect(useManageDocumentsQueryMock).toHaveBeenCalledWith(expect.anything(), false);
  });

  it("renders nothing until the permission has loaded, instead of flashing 'no access'", () => {
    useMyPermissionLevelMock.mockReturnValue({ allowed: false, loaded: false });
    const { container } = render(<AdminDocumentsPage />);
    expect(container).toBeEmptyDOMElement();
  });

  it("checks the document_vault 'write' permission", () => {
    render(<AdminDocumentsPage />);
    expect(useMyPermissionLevelMock).toHaveBeenCalledWith("document_vault", "write");
  });

  describe("OCD-497: Badge-based Target/version/mandatory tags", () => {
    it("renders the company-wide target as an 'All Employees' Badge", () => {
      useManageDocumentsQueryMock.mockReturnValue({
        data: paged([makeDoc({ id: 2, targetType: "all", recipientEmployeeIds: undefined })]),
        isLoading: false,
      });
      render(<AdminDocumentsPage />);
      const badge = screen.getByText("All Employees");
      expect(badge.className).toContain("--info-light");
    });

    it("renders an individual target as a '{n} employee(s)' Badge", () => {
      render(<AdminDocumentsPage />);
      const badge = screen.getByText("1 employee(s)");
      expect(badge.className).toContain("--purple-light");
    });

    it("shows the version tag and a Mandatory badge when flagged", () => {
      useManageDocumentsQueryMock.mockReturnValue({
        data: paged([makeDoc({ isMandatoryViewing: true, version: "3.2" })]),
        isLoading: false,
      });
      render(<AdminDocumentsPage />);
      expect(screen.getByText("v3.2")).toBeInTheDocument();
      expect(screen.getByText("Mandatory")).toBeInTheDocument();
    });
  });

  describe("Upload gating (document_vault write - Super Admin only by default)", () => {
    it("shows the Upload Document button to a user who holds document_vault write", () => {
      render(<AdminDocumentsPage />);
      expect(screen.getByRole("button", { name: "Upload Document" })).toBeInTheDocument();
    });

    it("does not show the Upload Document button without document_vault write", () => {
      useMyPermissionLevelMock.mockReturnValue({ allowed: false, loaded: true });
      render(<AdminDocumentsPage />);
      expect(screen.queryByRole("button", { name: "Upload Document" })).not.toBeInTheDocument();
    });
  });

  describe("OCD-500: Version Number required gating", () => {
    it("keeps Upload disabled until Title, Version and a target are filled in", () => {
      render(<AdminDocumentsPage />);
      fireEvent.click(screen.getByRole("button", { name: "Upload Document" }));

      const uploadButton = screen.getByRole("button", { name: "Upload" });
      expect(uploadButton).toBeDisabled();

      fireEvent.change(screen.getByPlaceholderText("e.g. Updated Employment Contract"), {
        target: { value: "New Policy" },
      });
      // Still disabled: no version yet, and 'individual' target needs an employee.
      expect(uploadButton).toBeDisabled();

      fireEvent.change(screen.getByPlaceholderText("e.g. 1.0"), { target: { value: "1.0" } });
      // Still disabled: default target is 'individual' with no employees selected.
      expect(uploadButton).toBeDisabled();

      fireEvent.click(screen.getByText("All Employees"));
      expect(uploadButton).not.toBeDisabled();
    });

    it("submits version and isMandatoryViewing on save", async () => {
      createMutateAsyncMock.mockResolvedValue({});
      render(<AdminDocumentsPage />);
      fireEvent.click(screen.getByRole("button", { name: "Upload Document" }));

      fireEvent.change(screen.getByPlaceholderText("e.g. Updated Employment Contract"), {
        target: { value: "New Policy" },
      });
      fireEvent.change(screen.getByPlaceholderText("e.g. 1.0"), { target: { value: "2.0" } });
      fireEvent.click(screen.getByText("Mark as mandatory viewing for employees"));
      fireEvent.click(screen.getByText("All Employees"));

      fireEvent.click(screen.getByRole("button", { name: "Upload" }));

      await waitFor(() => expect(createMutateAsyncMock).toHaveBeenCalled());
      const payload = createMutateAsyncMock.mock.calls[0][0];
      expect(payload.version).toBe("2.0");
      expect(payload.isMandatoryViewing).toBe(true);
      expect(payload.targetType).toBe("all");
    });
  });

  describe("OCD-495: file-type validation hint", () => {
    it("shows a hint listing the supported file types near the upload area", () => {
      render(<AdminDocumentsPage />);
      fireEvent.click(screen.getByRole("button", { name: "Upload Document" }));
      expect(screen.getByText("Supported file types: JPG, PNG, PDF, DOC, DOCX.")).toBeInTheDocument();
    });
  });

  describe("Delete confirmation", () => {
    it("opens a confirmation dialog instead of deleting immediately", () => {
      render(<AdminDocumentsPage />);
      const table = screen.getByRole("table");
      fireEvent.click(within(table).getByRole("button"));
      expect(deleteMutateAsyncMock).not.toHaveBeenCalled();
      expect(screen.getByText("Delete Document")).toBeInTheDocument();
    });
  });
});
