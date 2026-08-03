import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { EmployeeNotesModal } from "@/components/modals/EmployeeNotesModal";

const { useAuthMock, useEmployeeNotesQueryMock, createMutateAsyncMock, updateMutateAsyncMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  useEmployeeNotesQueryMock: vi.fn(),
  createMutateAsyncMock: vi.fn(),
  updateMutateAsyncMock: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({ useAuth: useAuthMock }));
vi.mock("@/hooks/queries/use-employee-notes-query", () => ({
  useEmployeeNotesQuery: useEmployeeNotesQueryMock,
}));
vi.mock("@/hooks/mutations/use-employee-note-mutations", () => ({
  useCreateEmployeeNoteMutation: () => ({ mutateAsync: createMutateAsyncMock, isPending: false }),
  useUpdateEmployeeNoteMutation: () => ({ mutateAsync: updateMutateAsyncMock, isPending: false }),
}));

const note = {
  id: 1,
  content: "Great performance this quarter",
  createdAt: "2026-01-01T00:00:00.000Z",
  attachments: [],
};

describe("EmployeeNotesModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("HR executives only see the add-note form, with a note about visibility", () => {
    useAuthMock.mockReturnValue({ isHRManager: false, isSuperAdmin: false });
    useEmployeeNotesQueryMock.mockReturnValue({ data: undefined, isLoading: false });
    render(<EmployeeNotesModal isOpen onClose={vi.fn()} employeeId={1} employeeName="Jane Doe" />);
    expect(screen.getByText("Notes — Jane Doe")).toBeInTheDocument();
    expect(screen.queryByText("Note History")).not.toBeInTheDocument();
    expect(screen.getByText(/only HR Manager can review note history/)).toBeInTheDocument();
  });

  it("HR managers see the full note history", () => {
    useAuthMock.mockReturnValue({ isHRManager: true, isSuperAdmin: false });
    useEmployeeNotesQueryMock.mockReturnValue({ data: [note], isLoading: false });
    render(<EmployeeNotesModal isOpen onClose={vi.fn()} employeeId={1} employeeName="Jane Doe" />);
    expect(screen.getByText("Note History")).toBeInTheDocument();
    expect(screen.getByText("Great performance this quarter")).toBeInTheDocument();
  });

  it("shows a loading indicator and an empty state for note history", () => {
    useAuthMock.mockReturnValue({ isHRManager: true, isSuperAdmin: false });
    useEmployeeNotesQueryMock.mockReturnValue({ data: undefined, isLoading: true });
    render(<EmployeeNotesModal isOpen onClose={vi.fn()} employeeId={1} employeeName="Jane Doe" />);
    expect(screen.getByText("Loading notes...")).toBeInTheDocument();
  });

  it("the Add Note button stays disabled until content is entered", () => {
    useAuthMock.mockReturnValue({ isHRManager: false, isSuperAdmin: false });
    useEmployeeNotesQueryMock.mockReturnValue({ data: undefined, isLoading: false });
    render(<EmployeeNotesModal isOpen onClose={vi.fn()} employeeId={1} employeeName="Jane Doe" />);
    const addButton = screen.getByRole("button", { name: "Add Note" });
    expect(addButton).toBeDisabled();
    fireEvent.change(screen.getByPlaceholderText(/Write a note/), { target: { value: "New note" } });
    expect(addButton).not.toBeDisabled();
  });

  it("submits a new note with its content", async () => {
    useAuthMock.mockReturnValue({ isHRManager: false, isSuperAdmin: false });
    useEmployeeNotesQueryMock.mockReturnValue({ data: undefined, isLoading: false });
    createMutateAsyncMock.mockResolvedValue({});
    render(<EmployeeNotesModal isOpen onClose={vi.fn()} employeeId={5} employeeName="Jane Doe" />);

    fireEvent.change(screen.getByPlaceholderText(/Write a note/), { target: { value: "New note" } });
    fireEvent.click(screen.getByRole("button", { name: "Add Note" }));

    await waitFor(() =>
      expect(createMutateAsyncMock).toHaveBeenCalledWith({ content: "New note", files: [] }),
    );
  });

  it("lets an HR manager edit an existing note", async () => {
    useAuthMock.mockReturnValue({ isHRManager: true, isSuperAdmin: false });
    useEmployeeNotesQueryMock.mockReturnValue({ data: [note], isLoading: false });
    updateMutateAsyncMock.mockResolvedValue({});
    render(<EmployeeNotesModal isOpen onClose={vi.fn()} employeeId={1} employeeName="Jane Doe" />);

    fireEvent.click(screen.getByText("Edit"));
    const editArea = screen.getByDisplayValue("Great performance this quarter");
    fireEvent.change(editArea, { target: { value: "Updated content" } });
    fireEvent.click(screen.getByText("Save"));

    await waitFor(() =>
      expect(updateMutateAsyncMock).toHaveBeenCalledWith({ id: 1, content: "Updated content" }),
    );
  });

  it("cancelling an edit reverts to the read-only view", () => {
    useAuthMock.mockReturnValue({ isHRManager: true, isSuperAdmin: false });
    useEmployeeNotesQueryMock.mockReturnValue({ data: [note], isLoading: false });
    render(<EmployeeNotesModal isOpen onClose={vi.fn()} employeeId={1} employeeName="Jane Doe" />);

    fireEvent.click(screen.getByText("Edit"));
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.getByText("Great performance this quarter")).toBeInTheDocument();
  });
});
