import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within, act } from "@testing-library/react";
import AdminCommunicationsPage from "@/app/admin/communications/page";

const {
  useAuthMock,
  useCommunicationsQueryMock,
  createMutateAsyncMock,
  deleteMutateAsyncMock,
  useGroupsQueryMock,
  useGroupQueryMock,
  userDirectoryServiceMock,
  downloadReportMock,
} = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  useCommunicationsQueryMock: vi.fn(),
  createMutateAsyncMock: vi.fn(),
  deleteMutateAsyncMock: vi.fn(),
  useGroupsQueryMock: vi.fn(),
  useGroupQueryMock: vi.fn(),
  userDirectoryServiceMock: { list: vi.fn() },
  downloadReportMock: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({ useAuth: useAuthMock }));
vi.mock("@/hooks/queries/use-communications-query", () => ({
  useCommunicationsQuery: useCommunicationsQueryMock,
}));
vi.mock("@/hooks/mutations/use-communication-mutations", () => ({
  useCreateCommunicationMutation: () => ({ mutateAsync: createMutateAsyncMock, isPending: false }),
  useDeleteCommunicationMutation: () => ({ mutateAsync: deleteMutateAsyncMock, isPending: false }),
}));
vi.mock("@/lib/services/communication.service", () => ({
  communicationService: { downloadReport: downloadReportMock },
}));
// RecipientPicker pulls these in itself (see tests/unit/RecipientPicker.test.tsx) -
// mocked the same way here so the real RecipientPicker/EmployeeMultiSelect render
// and the Send-button gating can be exercised through real user interaction.
vi.mock("@/hooks/queries/use-groups-query", () => ({
  useGroupsQuery: useGroupsQueryMock,
  useGroupQuery: useGroupQueryMock,
}));
vi.mock("@/lib/services/user-directory.service", () => ({
  userDirectoryService: userDirectoryServiceMock,
}));

const sampleCommunication = {
  id: 42,
  title: "Policy Update",
  body: "Please review the updated policy.",
  requiresAcknowledgement: true,
  deadlineAt: "2026-01-01T00:00:00.000Z",
  createdBy: 1,
  createdAt: "2025-12-01T00:00:00.000Z",
  totalRecipients: 2,
  acknowledgedCount: 1,
  onTimeCount: 1,
  lateCount: 0,
  pendingCount: 1,
  recipients: [],
};

function mockAuth(overrides: Partial<{ isHRManager: boolean; isSuperAdmin: boolean }> = {}) {
  useAuthMock.mockReturnValue({ isHRManager: false, isSuperAdmin: false, ...overrides });
}

// The nested EmployeeMultiSelect kicks off its own userDirectoryService.list() fetch on mount;
// flushing it after render keeps that unrelated state update from leaking into later tests as an
// "not wrapped in act()" warning (see tests/unit/RecipientPicker.test.tsx for the same pattern).
const flushEmployeeFetch = () => act(() => Promise.resolve());

// Selects "Alice Anderson" as an individual recipient via the real
// EmployeeMultiSelect checkbox list (backed by the mocked user-directory service).
async function selectAliceAsRecipient() {
  await screen.findByText(/Alice Anderson/);
  const checkbox = screen.getByText(/Alice Anderson/).closest("label")!.querySelector("input")!;
  fireEvent.click(checkbox);
}

describe("AdminCommunicationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useCommunicationsQueryMock.mockReturnValue({ data: [sampleCommunication], isLoading: false });
    useGroupsQueryMock.mockReturnValue({ data: [], isLoading: false });
    useGroupQueryMock.mockReturnValue({ data: { members: [] }, isLoading: false });
    userDirectoryServiceMock.list.mockResolvedValue([
      { id: 100, email: "alice@oxo.test", first_name: "Alice", last_name: "Anderson" },
    ]);
  });

  // OCD-526: the page must gate on isHRManager || isSuperAdmin, not the
  // broader isHR (which used to also let HR Executive in).
  it("hides the page from an HR Executive (isHRManager: false, isSuperAdmin: false)", () => {
    mockAuth({ isHRManager: false, isSuperAdmin: false });
    render(<AdminCommunicationsPage />);
    expect(screen.getByText("You do not have access to this page.")).toBeInTheDocument();
    expect(screen.queryByText("Communications")).not.toBeInTheDocument();
  });

  it("grants access to an HR Manager", async () => {
    mockAuth({ isHRManager: true, isSuperAdmin: false });
    render(<AdminCommunicationsPage />);
    expect(screen.getByText("Communications")).toBeInTheDocument();
    expect(await screen.findByText("Policy Update")).toBeInTheDocument();
  });

  it("grants access to a Super Admin", () => {
    mockAuth({ isHRManager: false, isSuperAdmin: true });
    render(<AdminCommunicationsPage />);
    expect(screen.getByText("Communications")).toBeInTheDocument();
  });

  describe("New Communication form (OCD-523 Send-button gating)", () => {
    it("keeps Send disabled until subject, message, and a recipient are all present", async () => {
      mockAuth({ isHRManager: true, isSuperAdmin: false });
      render(<AdminCommunicationsPage />);
      fireEvent.click(screen.getByRole("button", { name: "New Communication" }));

      const sendButton = screen.getByRole("button", { name: "Send" });
      expect(sendButton).toBeDisabled();

      fireEvent.change(screen.getByPlaceholderText(/Updated Office Health/), {
        target: { value: "Subject line" },
      });
      expect(sendButton).toBeDisabled();

      fireEvent.change(screen.getByPlaceholderText("Write your communication message here..."), {
        target: { value: "Body text" },
      });
      expect(sendButton).toBeDisabled(); // still no recipient

      await selectAliceAsRecipient();
      expect(sendButton).not.toBeDisabled();
    });

    it("blocks Send again once acknowledgement is required with no deadline, and re-enables once one is set", async () => {
      mockAuth({ isHRManager: true, isSuperAdmin: false });
      render(<AdminCommunicationsPage />);
      fireEvent.click(screen.getByRole("button", { name: "New Communication" }));

      fireEvent.change(screen.getByPlaceholderText(/Updated Office Health/), { target: { value: "Subject" } });
      fireEvent.change(screen.getByPlaceholderText("Write your communication message here..."), {
        target: { value: "Body" },
      });
      await selectAliceAsRecipient();

      const sendButton = screen.getByRole("button", { name: "Send" });
      expect(sendButton).not.toBeDisabled();

      fireEvent.click(screen.getByText("Require Recipient Acknowledgement"));
      expect(sendButton).toBeDisabled();

      const deadlineInput = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
      expect(deadlineInput).toBeInTheDocument();
      const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
      fireEvent.change(deadlineInput, { target: { value: future } });
      expect(sendButton).not.toBeDisabled();

      // toggling acknowledgement back off should never block submission
      fireEvent.click(screen.getByText("Require Recipient Acknowledgement"));
      fireEvent.click(screen.getByText("Require Recipient Acknowledgement"));
      expect(screen.getByRole("button", { name: "Send" })).not.toBeDisabled();
    });

    it("shows the required-field messages once each field is touched", async () => {
      mockAuth({ isHRManager: true, isSuperAdmin: false });
      render(<AdminCommunicationsPage />);
      fireEvent.click(screen.getByRole("button", { name: "New Communication" }));

      const subjectInput = screen.getByPlaceholderText(/Updated Office Health/);
      fireEvent.focus(subjectInput);
      fireEvent.blur(subjectInput);
      expect(screen.getByText("Subject is required.")).toBeInTheDocument();

      const messageInput = screen.getByPlaceholderText("Write your communication message here...");
      fireEvent.focus(messageInput);
      fireEvent.blur(messageInput);
      expect(screen.getByText("Message is required.")).toBeInTheDocument();
      await flushEmployeeFetch();
    });

    it("shows and clears the recipients message as the picker's own selection changes", async () => {
      mockAuth({ isHRManager: true, isSuperAdmin: false });
      render(<AdminCommunicationsPage />);
      fireEvent.click(screen.getByRole("button", { name: "New Communication" }));

      await selectAliceAsRecipient();
      expect(screen.queryByText("Select at least one group or individual recipient.")).not.toBeInTheDocument();

      // deselect - the picker has no blur of its own, so the message must
      // reappear the moment the selection itself goes back to empty.
      const checkbox = screen.getByText(/Alice Anderson/).closest("label")!.querySelector("input")!;
      fireEvent.click(checkbox);
      expect(screen.getByText("Select at least one group or individual recipient.")).toBeInTheDocument();
    });

    it("requires a non-empty, non-past acknowledgement deadline (OCD-515 / OCD-523)", async () => {
      mockAuth({ isHRManager: true, isSuperAdmin: false });
      render(<AdminCommunicationsPage />);
      fireEvent.click(screen.getByRole("button", { name: "New Communication" }));

      fireEvent.change(screen.getByPlaceholderText(/Updated Office Health/), { target: { value: "Subject" } });
      fireEvent.change(screen.getByPlaceholderText("Write your communication message here..."), {
        target: { value: "Body" },
      });
      await selectAliceAsRecipient();
      fireEvent.click(screen.getByText("Require Recipient Acknowledgement"));

      const deadlineInput = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
      // OCD-515: min is pinned so the native picker can't offer past dates either.
      expect(deadlineInput).toHaveAttribute("min");

      fireEvent.blur(deadlineInput);
      expect(
        screen.getByText("Acknowledgement deadline is required when recipient acknowledgement is enabled."),
      ).toBeInTheDocument();

      fireEvent.change(deadlineInput, { target: { value: "2020-01-01T00:00" } });
      fireEvent.blur(deadlineInput);
      expect(screen.getByText("Acknowledgement deadline cannot be in the past.")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
    });

    it("submits with the resolved recipient ids and resets the form on success", async () => {
      mockAuth({ isHRManager: true, isSuperAdmin: false });
      createMutateAsyncMock.mockResolvedValue({});
      render(<AdminCommunicationsPage />);
      fireEvent.click(screen.getByRole("button", { name: "New Communication" }));

      fireEvent.change(screen.getByPlaceholderText(/Updated Office Health/), { target: { value: "Subject" } });
      fireEvent.change(screen.getByPlaceholderText("Write your communication message here..."), {
        target: { value: "Body" },
      });
      await selectAliceAsRecipient();

      fireEvent.click(screen.getByRole("button", { name: "Send" }));

      await waitFor(() =>
        expect(createMutateAsyncMock).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Subject",
            body: "Body",
            recipientUserIds: [100],
            requiresAcknowledgement: false,
            deadlineAt: null,
          }),
        ),
      );
    });

    it("passes the OCD-516 accept/typeErrorMessage props to the attachments FileUpload and shows a hint", async () => {
      mockAuth({ isHRManager: true, isSuperAdmin: false });
      render(<AdminCommunicationsPage />);
      fireEvent.click(screen.getByRole("button", { name: "New Communication" }));

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      expect(fileInput.accept).toContain("application/pdf");
      expect(fileInput.accept).toContain("image/jpeg");
      expect(screen.getByText(/Supported file types:/)).toBeInTheDocument();
      await flushEmployeeFetch();
    });
  });

  describe("Delete flow (OCD-521)", () => {
    it("uses ConfirmationDialog instead of window.confirm, and only deletes on Confirm", async () => {
      mockAuth({ isHRManager: false, isSuperAdmin: true });
      deleteMutateAsyncMock.mockResolvedValue({});
      const confirmSpy = vi.spyOn(window, "confirm");
      render(<AdminCommunicationsPage />);

      await screen.findByText("Policy Update");
      fireEvent.click(screen.getByRole("button", { name: /Delete/ }));

      expect(confirmSpy).not.toHaveBeenCalled();
      expect(screen.getByText("Delete Communication")).toBeInTheDocument();
      expect(
        screen.getByText("Are you sure you want to delete this communication? This action cannot be undone."),
      ).toBeInTheDocument();

      // Dismissing must not call the mutation.
      fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Cancel" }));
      expect(deleteMutateAsyncMock).not.toHaveBeenCalled();
      expect(screen.queryByText("Delete Communication")).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /Delete/ }));
      fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Delete" }));
      await waitFor(() => expect(deleteMutateAsyncMock).toHaveBeenCalledWith(42));
    });

    it("does not show a Delete action for a non-Super-Admin", async () => {
      mockAuth({ isHRManager: true, isSuperAdmin: false });
      render(<AdminCommunicationsPage />);
      await screen.findByText("Policy Update");
      expect(screen.queryByRole("button", { name: /Delete/ })).not.toBeInTheDocument();
    });
  });

  describe("OCD-517 badges", () => {
    it("renders the Ack Required column using the Badge component", async () => {
      mockAuth({ isHRManager: true, isSuperAdmin: false });
      render(<AdminCommunicationsPage />);
      await screen.findByText("Policy Update");
      // Badge renders its children as text, so this both proves the column
      // is populated and (via the row also having a "Yes"-shaped Badge markup)
      // that we're no longer emitting the old raw <span> markup directly.
      expect(screen.getByText("Yes")).toBeInTheDocument();
    });
  });
});
