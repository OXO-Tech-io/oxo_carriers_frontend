import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import AdminNoticesPage from "@/app/admin/notices/page";
import type { Notice } from "@/types/hrModules";

const {
  useAuthMock,
  useManageNoticesQueryMock,
  createMutateAsyncMock,
  updateMutateAsyncMock,
  deleteMutateAsyncMock,
} = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  useManageNoticesQueryMock: vi.fn(),
  createMutateAsyncMock: vi.fn(),
  updateMutateAsyncMock: vi.fn(),
  deleteMutateAsyncMock: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({ useAuth: useAuthMock }));
vi.mock("@/hooks/queries/use-notices-query", () => ({
  useManageNoticesQuery: useManageNoticesQueryMock,
}));
vi.mock("@/hooks/mutations/use-notice-mutations", () => ({
  useCreateNoticeMutation: () => ({ mutateAsync: createMutateAsyncMock, isPending: false }),
  useUpdateNoticeMutation: () => ({ mutateAsync: updateMutateAsyncMock, isPending: false }),
  useDeleteNoticeMutation: () => ({ mutateAsync: deleteMutateAsyncMock, isPending: false }),
}));

function makeNotice(overrides: Partial<Notice> = {}): Notice {
  return {
    id: 1,
    title: "Office closed on Friday",
    message: "The office will be closed for a public holiday.",
    imageUrl: null,
    isActive: true,
    startAt: "2020-01-01T09:00:00.000Z",
    endAt: null,
    createdBy: null,
    updatedBy: null,
    createdAt: "2020-01-01T00:00:00.000Z",
    updatedAt: "2020-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("AdminNoticesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({ isHR: true, isSuperAdmin: false });
    useManageNoticesQueryMock.mockReturnValue({ data: [makeNotice()], isLoading: false });
  });

  it("denies access to a role without permission", () => {
    useAuthMock.mockReturnValue({ isHR: false, isSuperAdmin: false });
    render(<AdminNoticesPage />);
    expect(screen.getByText("You do not have access to this page.")).toBeInTheDocument();
  });

  it("renders the Active/Inactive status as a Badge instead of the old raw pill", () => {
    useManageNoticesQueryMock.mockReturnValue({
      data: [makeNotice({ isActive: true }), makeNotice({ id: 2, title: "Inactive one", isActive: false })],
      isLoading: false,
    });
    render(<AdminNoticesPage />);
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("truncates a long title with a title attribute carrying the full text", () => {
    const longTitle = "A".repeat(150);
    useManageNoticesQueryMock.mockReturnValue({ data: [makeNotice({ title: longTitle })], isLoading: false });
    render(<AdminNoticesPage />);
    const titleEl = screen.getByText(longTitle);
    expect(titleEl).toHaveAttribute("title", longTitle);
    expect(titleEl.className).toMatch(/truncate/);
  });

  describe("Create/Edit form validation", () => {
    it("shows a live character counter for Title and Message that updates on keystroke", () => {
      render(<AdminNoticesPage />);
      fireEvent.click(screen.getByRole("button", { name: "Create Notice" }));

      expect(screen.getByText("0 / 100")).toBeInTheDocument();
      expect(screen.getByText("0 / 1000")).toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText("e.g. Office closed on Friday"), {
        target: { value: "Hello" },
      });
      expect(screen.getByText("5 / 100")).toBeInTheDocument();

      fireEvent.change(screen.getByPlaceholderText("Notice details..."), {
        target: { value: "Hi there" },
      });
      expect(screen.getByText("8 / 1000")).toBeInTheDocument();
    });

    it("enforces maxLength on the Title and Message inputs", () => {
      render(<AdminNoticesPage />);
      fireEvent.click(screen.getByRole("button", { name: "Create Notice" }));

      expect(screen.getByPlaceholderText("e.g. Office closed on Friday")).toHaveAttribute("maxLength", "100");
      expect(screen.getByPlaceholderText("Notice details...")).toHaveAttribute("maxLength", "1000");
    });

    it("keeps Create disabled until title, message, a start date and an end date are all filled in", () => {
      render(<AdminNoticesPage />);
      fireEvent.click(screen.getByRole("button", { name: "Create Notice" }));

      const createButton = screen.getByRole("button", { name: "Create" });
      expect(createButton).toBeDisabled();

      fireEvent.change(screen.getByPlaceholderText("e.g. Office closed on Friday"), {
        target: { value: "New notice" },
      });
      fireEvent.change(screen.getByPlaceholderText("Notice details..."), {
        target: { value: "Some details" },
      });
      // Start Date & Time defaults to "now" on open, but End Date & Time (also
      // required, OCD-565) is still empty, so Create must stay disabled.
      expect(createButton).toBeDisabled();

      // Far-future so it's always after "now" (Start Date's default), regardless of when this runs.
      fireEvent.change(screen.getByLabelText("End Date & Time"), {
        target: { value: "2030-01-01T10:00" },
      });
      expect(createButton).not.toBeDisabled();
    });

    it("rejects an End Date/Time before the Start Date/Time with an inline error, and blocks Save", async () => {
      render(<AdminNoticesPage />);
      fireEvent.click(screen.getByRole("button", { name: "Create Notice" }));

      fireEvent.change(screen.getByPlaceholderText("e.g. Office closed on Friday"), {
        target: { value: "New notice" },
      });
      fireEvent.change(screen.getByPlaceholderText("Notice details..."), {
        target: { value: "Some details" },
      });

      const startInput = screen.getByLabelText("Start Date & Time");
      const endInput = screen.getByLabelText("End Date & Time");

      fireEvent.change(startInput, { target: { value: "2026-06-10T10:00" } });
      fireEvent.change(endInput, { target: { value: "2026-06-09T10:00" } });

      expect(
        screen.getByText("End date/time must be on or after the start date/time."),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Create" })).toBeDisabled();

      fireEvent.click(screen.getByRole("button", { name: "Create" }));
      expect(createMutateAsyncMock).not.toHaveBeenCalled();
    });

    it("submits startAt/endAt as ISO strings on create", async () => {
      createMutateAsyncMock.mockResolvedValue({});
      render(<AdminNoticesPage />);
      fireEvent.click(screen.getByRole("button", { name: "Create Notice" }));

      fireEvent.change(screen.getByPlaceholderText("e.g. Office closed on Friday"), {
        target: { value: "New notice" },
      });
      fireEvent.change(screen.getByPlaceholderText("Notice details..."), {
        target: { value: "Some details" },
      });
      fireEvent.change(screen.getByLabelText("Start Date & Time"), {
        target: { value: "2026-06-10T10:00" },
      });
      fireEvent.change(screen.getByLabelText("End Date & Time"), {
        target: { value: "2026-06-11T10:00" },
      });

      fireEvent.click(screen.getByRole("button", { name: "Create" }));

      await waitFor(() => expect(createMutateAsyncMock).toHaveBeenCalled());
      const payload = createMutateAsyncMock.mock.calls[0][0];
      expect(payload.title).toBe("New notice");
      expect(new Date(payload.startAt).toISOString()).toBe(payload.startAt);
      expect(new Date(payload.endAt).toISOString()).toBe(payload.endAt);
    });
  });

  describe("Activate/Deactivate confirmation", () => {
    it("does not change status immediately - it opens a confirmation dialog instead", () => {
      render(<AdminNoticesPage />);
      fireEvent.click(screen.getByRole("button", { name: "Deactivate" }));

      expect(screen.getByText("Are you sure you want to deactivate this notice?")).toBeInTheDocument();
      expect(updateMutateAsyncMock).not.toHaveBeenCalled();
    });

    it("applies the status change only after Confirm is clicked", async () => {
      updateMutateAsyncMock.mockResolvedValue({});
      render(<AdminNoticesPage />);

      fireEvent.click(screen.getByRole("button", { name: "Deactivate" }));
      const dialogTitle = screen.getByText("Deactivate Notice");
      const dialog = dialogTitle.closest('[role="dialog"]') as HTMLElement;
      expect(dialog).toBeTruthy();

      fireEvent.click(within(dialog).getByRole("button", { name: "Deactivate" }));

      await waitFor(() =>
        expect(updateMutateAsyncMock).toHaveBeenCalledWith({ id: 1, input: { isActive: false } }),
      );
    });

    it("leaves status unchanged when the confirmation is cancelled", () => {
      render(<AdminNoticesPage />);

      fireEvent.click(screen.getByRole("button", { name: "Deactivate" }));
      const dialogTitle = screen.getByText("Deactivate Notice");
      const dialog = dialogTitle.closest('[role="dialog"]') as HTMLElement;

      fireEvent.click(within(dialog).getByRole("button", { name: "Cancel" }));

      expect(updateMutateAsyncMock).not.toHaveBeenCalled();
      expect(screen.queryByText("Deactivate Notice")).not.toBeInTheDocument();
    });

    it("shows an activate-worded confirmation for an inactive notice", () => {
      useManageNoticesQueryMock.mockReturnValue({ data: [makeNotice({ isActive: false })], isLoading: false });
      render(<AdminNoticesPage />);

      fireEvent.click(screen.getByRole("button", { name: "Activate" }));
      expect(screen.getByText("Are you sure you want to activate this notice?")).toBeInTheDocument();
    });
  });

  describe("View action", () => {
    it("opens a read-only preview modal with the full title and message", () => {
      const longMessage = "Full message body. ".repeat(10);
      useManageNoticesQueryMock.mockReturnValue({
        data: [makeNotice({ title: "Preview me", message: longMessage })],
        isLoading: false,
      });
      render(<AdminNoticesPage />);

      fireEvent.click(screen.getByLabelText("View notice"));

      // "Preview me" also appears in the table row behind the modal, so scope
      // the assertions to the dialog itself.
      const dialog = screen.getByRole("dialog");
      expect(within(dialog).getByText("Notice Preview")).toBeInTheDocument();
      expect(within(dialog).getByText("Preview me")).toBeInTheDocument();
      expect(within(dialog).getByText(longMessage.trim())).toBeInTheDocument();
    });

    it("works for an inactive notice too", () => {
      useManageNoticesQueryMock.mockReturnValue({
        data: [makeNotice({ title: "Inactive preview", isActive: false })],
        isLoading: false,
      });
      render(<AdminNoticesPage />);

      fireEvent.click(screen.getByLabelText("View notice"));
      const dialog = screen.getByRole("dialog");
      expect(within(dialog).getByText("Notice Preview")).toBeInTheDocument();
      expect(within(dialog).getByText("Inactive preview")).toBeInTheDocument();
    });

    it("closes via the Close action", () => {
      render(<AdminNoticesPage />);
      fireEvent.click(screen.getByLabelText("View notice"));
      expect(screen.getByText("Notice Preview")).toBeInTheDocument();

      // The modal header also has an icon-only "Close" (aria-label) button;
      // target the visible-text footer Close action specifically.
      fireEvent.click(screen.getByText("Close"));
      expect(screen.queryByText("Notice Preview")).not.toBeInTheDocument();
    });
  });

  describe("Delete-icon alignment (OCD-571)", () => {
    it("wraps the Activate/Deactivate button in a fixed-width cell so Delete's position doesn't shift", () => {
      useManageNoticesQueryMock.mockReturnValue({
        data: [makeNotice({ id: 1, isActive: true }), makeNotice({ id: 2, isActive: false })],
        isLoading: false,
      });
      render(<AdminNoticesPage />);

      const activateButton = screen.getByRole("button", { name: "Activate" });
      const deactivateButton = screen.getByRole("button", { name: "Deactivate" });

      // Both rows' status-toggle buttons sit inside a wrapper of the same fixed width,
      // so "Activate" and "Deactivate" (different text lengths) don't shift Delete's column.
      expect(activateButton.parentElement?.className).toContain("w-20");
      expect(deactivateButton.parentElement?.className).toContain("w-20");
    });
  });
});
