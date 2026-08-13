import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DocumentVaultModal } from "@/components/modals/DocumentVaultModal";

const { useEmployeeDocumentsQueryMock, createMutateAsyncMock, deleteMutateAsyncMock } = vi.hoisted(() => ({
  useEmployeeDocumentsQueryMock: vi.fn(),
  createMutateAsyncMock: vi.fn(),
  deleteMutateAsyncMock: vi.fn(),
}));

vi.mock("@/hooks/queries/use-documents-query", () => ({
  useEmployeeDocumentsQuery: useEmployeeDocumentsQueryMock,
}));
vi.mock("@/hooks/mutations/use-document-mutations", () => ({
  useCreateDocumentMutation: () => ({ mutateAsync: createMutateAsyncMock, isPending: false }),
  useDeleteDocumentMutation: () => ({ mutateAsync: deleteMutateAsyncMock, isPending: false }),
}));

const individualDoc = {
  id: 1,
  title: "Employment Contract",
  description: "Signed copy",
  targetType: "individual" as const,
  createdAt: "2026-01-01T00:00:00.000Z",
  attachments: [{ id: 10, fileName: "contract.pdf", fileUrl: "/uploads/documents/contract.pdf" }],
};

const allDoc = {
  id: 2,
  title: "Company Handbook",
  description: null,
  targetType: "all" as const,
  createdAt: "2026-01-02T00:00:00.000Z",
  attachments: [],
};

describe("DocumentVaultModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the employee's name in the title and lists their documents", () => {
    useEmployeeDocumentsQueryMock.mockReturnValue({ data: [individualDoc], isLoading: false });
    render(<DocumentVaultModal isOpen onClose={vi.fn()} employeeId={1} employeeName="Jane Doe" />);
    expect(screen.getByText("Document Vault — Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("Employment Contract")).toBeInTheDocument();
    expect(screen.getByText("contract.pdf")).toBeInTheDocument();
  });

  it("shows a loading indicator and an empty state", () => {
    useEmployeeDocumentsQueryMock.mockReturnValue({ data: undefined, isLoading: true });
    render(<DocumentVaultModal isOpen onClose={vi.fn()} employeeId={1} employeeName="Jane Doe" />);
    expect(screen.getByText("Loading documents...")).toBeInTheDocument();
  });

  it("the Upload button stays disabled until a title is entered", () => {
    useEmployeeDocumentsQueryMock.mockReturnValue({ data: [], isLoading: false });
    render(<DocumentVaultModal isOpen onClose={vi.fn()} employeeId={1} employeeName="Jane Doe" />);
    const uploadButton = screen.getByRole("button", { name: "Upload" });
    expect(uploadButton).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText("Document title..."), { target: { value: "New doc" } });
    expect(uploadButton).not.toBeDisabled();
  });

  it("submits a new document targeted only at this employee", async () => {
    useEmployeeDocumentsQueryMock.mockReturnValue({ data: [], isLoading: false });
    createMutateAsyncMock.mockResolvedValue({});
    render(<DocumentVaultModal isOpen onClose={vi.fn()} employeeId={5} employeeName="Jane Doe" />);

    fireEvent.change(screen.getByPlaceholderText("Document title..."), { target: { value: "New doc" } });
    fireEvent.click(screen.getByRole("button", { name: "Upload" }));

    await waitFor(() =>
      expect(createMutateAsyncMock).toHaveBeenCalledWith({
        title: "New doc",
        description: undefined,
        targetType: "individual",
        individualEmployeeIds: [5],
        files: [],
      }),
    );
  });

  it("only lists individually-targeted documents, excluding 'All Employees' ones", () => {
    useEmployeeDocumentsQueryMock.mockReturnValue({ data: [individualDoc, allDoc], isLoading: false });
    render(<DocumentVaultModal isOpen onClose={vi.fn()} employeeId={1} employeeName="Jane Doe" />);

    expect(screen.getByText("Employment Contract")).toBeInTheDocument();
    expect(screen.queryByText("Company Handbook")).not.toBeInTheDocument();

    const deleteButtons = screen.getAllByTitle("Delete document");
    expect(deleteButtons).toHaveLength(1);
    fireEvent.click(deleteButtons[0]);
    expect(deleteMutateAsyncMock).toHaveBeenCalledWith(individualDoc.id);
  });
});
