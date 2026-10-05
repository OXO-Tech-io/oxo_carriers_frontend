import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DocumentVaultModal } from "@/components/modals/DocumentVaultModal";

const { useEmployeeDocumentsQueryMock, createMutateAsyncMock, deleteMutateAsyncMock, useMyPermissionLevelMock } =
  vi.hoisted(() => ({
    useEmployeeDocumentsQueryMock: vi.fn(),
    createMutateAsyncMock: vi.fn(),
    deleteMutateAsyncMock: vi.fn(),
    useMyPermissionLevelMock: vi.fn(),
  }));

vi.mock("@/hooks/queries/use-documents-query", () => ({
  useEmployeeDocumentsQuery: useEmployeeDocumentsQueryMock,
}));
vi.mock("@/hooks/mutations/use-document-mutations", () => ({
  useCreateDocumentMutation: () => ({ mutateAsync: createMutateAsyncMock, isPending: false }),
  useDeleteDocumentMutation: () => ({ mutateAsync: deleteMutateAsyncMock, isPending: false }),
}));
vi.mock("@/hooks/useMyPermissionLevel", () => ({
  useMyPermissionLevel: useMyPermissionLevelMock,
}));

const individualDoc = {
  id: 1,
  title: "Employment Contract",
  description: "Signed copy",
  targetType: "individual" as const,
  version: "1.0",
  isMandatoryViewing: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  attachments: [{ id: 10, fileName: "contract.pdf", fileUrl: "/uploads/documents/contract.pdf" }],
};

const allDoc = {
  id: 2,
  title: "Company Handbook",
  description: null,
  targetType: "all" as const,
  version: "2.1",
  isMandatoryViewing: true,
  createdAt: "2026-01-02T00:00:00.000Z",
  attachments: [],
};

// Default: a user holding document_vault 'write' (Super Admin by default).
const canUploadPermission = { allowed: true, loaded: true };
// HR Manager / HR Executive only get document_vault 'read' by default.
const readOnlyPermission = { allowed: false, loaded: true };

describe("DocumentVaultModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useMyPermissionLevelMock.mockReturnValue(canUploadPermission);
  });

  it("renders the employee's name in the title and lists their documents", () => {
    useEmployeeDocumentsQueryMock.mockReturnValue({ data: [individualDoc], isLoading: false });
    render(<DocumentVaultModal isOpen onClose={vi.fn()} employeeId={1} employeeName="Jane Doe" />);
    expect(screen.getByText("Document Vault — Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Employment Contract")).toBeInTheDocument();
    expect(screen.getByText("contract.pdf")).toBeInTheDocument();
    expect(screen.getByText("v1.0")).toBeInTheDocument();
  });

  it("shows a loading indicator and an empty state", () => {
    useEmployeeDocumentsQueryMock.mockReturnValue({ data: undefined, isLoading: true });
    render(<DocumentVaultModal isOpen onClose={vi.fn()} employeeId={1} employeeName="Jane Doe" />);
    expect(screen.getByText("Loading documents...")).toBeInTheDocument();
  });

  it("shows a Mandatory badge for documents flagged as mandatory viewing", () => {
    useEmployeeDocumentsQueryMock.mockReturnValue({
      data: [{ ...individualDoc, isMandatoryViewing: true }],
      isLoading: false,
    });
    render(<DocumentVaultModal isOpen onClose={vi.fn()} employeeId={1} employeeName="Jane Doe" />);
    expect(screen.getByText("Mandatory")).toBeInTheDocument();
  });

  it("the Upload button stays disabled until a title and version are entered", () => {
    useEmployeeDocumentsQueryMock.mockReturnValue({ data: [], isLoading: false });
    render(<DocumentVaultModal isOpen onClose={vi.fn()} employeeId={1} employeeName="Jane Doe" />);
    const uploadButton = screen.getByRole("button", { name: "Upload" });
    expect(uploadButton).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("Document title..."), { target: { value: "New doc" } });
    // Title alone isn't enough - version is required too (OCD-500).
    expect(uploadButton).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("Version Number (e.g. 1.0)"), { target: { value: "1.0" } });
    expect(uploadButton).not.toBeDisabled();
  });

  it("submits a new document targeted only at this employee, including version and mandatory-viewing flag", async () => {
    useEmployeeDocumentsQueryMock.mockReturnValue({ data: [], isLoading: false });
    createMutateAsyncMock.mockResolvedValue({});
    render(<DocumentVaultModal isOpen onClose={vi.fn()} employeeId={5} employeeName="Jane Doe" />);

    fireEvent.change(screen.getByPlaceholderText("Document title..."), { target: { value: "New doc" } });
    fireEvent.change(screen.getByPlaceholderText("Version Number (e.g. 1.0)"), { target: { value: "1.0" } });
    fireEvent.click(screen.getByText("Mark as mandatory viewing for employees"));
    fireEvent.click(screen.getByRole("button", { name: "Upload" }));

    await waitFor(() =>
      expect(createMutateAsyncMock).toHaveBeenCalledWith({
        title: "New doc",
        description: undefined,
        targetType: "individual",
        individualEmployeeIds: [5],
        files: [],
        version: "1.0",
        isMandatoryViewing: true,
      }),
    );
  });

  it("only lists individually-targeted documents, excluding 'All Employees' ones", () => {
    useEmployeeDocumentsQueryMock.mockReturnValue({ data: [individualDoc, allDoc], isLoading: false });
    render(<DocumentVaultModal isOpen onClose={vi.fn()} employeeId={1} employeeName="Jane Doe" />);

    expect(screen.getByText("Employment Contract")).toBeInTheDocument();
    expect(screen.queryByText("Company Handbook")).not.toBeInTheDocument();
    expect(screen.getAllByTitle("Delete document")).toHaveLength(1);
  });

  // OCD-501: deleting a document now requires confirming via ConfirmationDialog -
  // the trash icon must no longer delete immediately.
  describe("delete confirmation", () => {
    beforeEach(() => {
      useEmployeeDocumentsQueryMock.mockReturnValue({ data: [individualDoc], isLoading: false });
    });

    it("does not delete immediately when the trash icon is clicked", () => {
      render(<DocumentVaultModal isOpen onClose={vi.fn()} employeeId={1} employeeName="Jane Doe" />);
      fireEvent.click(screen.getByTitle("Delete document"));
      expect(deleteMutateAsyncMock).not.toHaveBeenCalled();
      expect(screen.getByText("Delete Document")).toBeInTheDocument();
      expect(
        screen.getByText("Are you sure you want to delete this document? This action cannot be undone."),
      ).toBeInTheDocument();
    });

    it("cancelling the confirmation dialog leaves the document untouched", () => {
      render(<DocumentVaultModal isOpen onClose={vi.fn()} employeeId={1} employeeName="Jane Doe" />);
      fireEvent.click(screen.getByTitle("Delete document"));
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(deleteMutateAsyncMock).not.toHaveBeenCalled();
      expect(screen.queryByText("Delete Document")).not.toBeInTheDocument();
    });

    it("only calls the delete mutation once Confirm is clicked", async () => {
      render(<DocumentVaultModal isOpen onClose={vi.fn()} employeeId={1} employeeName="Jane Doe" />);
      fireEvent.click(screen.getByTitle("Delete document"));
      expect(deleteMutateAsyncMock).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole("button", { name: "Delete" }));
      await waitFor(() => expect(deleteMutateAsyncMock).toHaveBeenCalledWith(individualDoc.id));
    });
  });

  // Upload follows the document_vault 'write' permission (Super Admin only by
  // default), even if this modal were ever reached through another path than
  // the Users page icon.
  describe("upload gating", () => {
    beforeEach(() => {
      useMyPermissionLevelMock.mockReturnValue(readOnlyPermission);
      useEmployeeDocumentsQueryMock.mockReturnValue({ data: [individualDoc], isLoading: false });
    });

    it("hides the Upload Document form entirely without document_vault write (HR Manager / HR Executive)", () => {
      render(<DocumentVaultModal isOpen onClose={vi.fn()} employeeId={1} employeeName="Jane Doe" />);
      expect(screen.queryByText("Upload Document")).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText("Document title...")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Upload" })).not.toBeInTheDocument();
      // Document History (view) is unaffected by the upload gate.
      expect(screen.getByText("Employment Contract")).toBeInTheDocument();
    });

    it("checks the document_vault 'write' permission", () => {
      render(<DocumentVaultModal isOpen onClose={vi.fn()} employeeId={1} employeeName="Jane Doe" />);
      expect(useMyPermissionLevelMock).toHaveBeenCalledWith("document_vault", "write");
    });
  });
});
