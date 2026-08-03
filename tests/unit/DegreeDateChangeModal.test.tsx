import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DegreeDateChangeModal from "@/components/modals/DegreeDateChangeModal";

const { toastMock, mutateAsyncMock } = vi.hoisted(() => ({
  toastMock: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
  mutateAsyncMock: vi.fn(),
}));

vi.mock("@/contexts/ToastContext", () => ({ useToast: () => toastMock }));
vi.mock("@/hooks/mutations/use-submit-profile-change-mutation", () => ({
  useSubmitProfileChangeMutation: () => ({ mutateAsync: mutateAsyncMock }),
}));

describe("DegreeDateChangeModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pre-fills the date input with the current value", () => {
    render(<DegreeDateChangeModal isOpen onClose={vi.fn()} currentDate="2020-05-01" />);
    expect(screen.getByDisplayValue("2020-05-01")).toBeInTheDocument();
  });

  it("shows an info toast and skips the mutation when nothing changed", async () => {
    render(<DegreeDateChangeModal isOpen onClose={vi.fn()} currentDate="2020-05-01" />);
    fireEvent.click(screen.getByText("Submit for Approval"));
    await waitFor(() => expect(toastMock.info).toHaveBeenCalled());
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it("submits a change request and closes on success", async () => {
    mutateAsyncMock.mockResolvedValue({});
    const onClose = vi.fn();
    render(<DegreeDateChangeModal isOpen onClose={onClose} currentDate="2020-05-01" />);

    fireEvent.change(screen.getByDisplayValue("2020-05-01"), { target: { value: "2021-06-15" } });
    fireEvent.click(screen.getByText("Submit for Approval"));

    await waitFor(() =>
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        changes: [
          {
            entityType: "user_field",
            field: "undergraduateDegreeCompletionDate",
            operation: "update",
            before: "2020-05-01",
            after: "2021-06-15",
          },
        ],
      }),
    );
    await waitFor(() => expect(toastMock.success).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
  });

  it("shows an error toast and keeps the modal open when the mutation fails", async () => {
    mutateAsyncMock.mockRejectedValue(new Error("network"));
    const onClose = vi.fn();
    render(<DegreeDateChangeModal isOpen onClose={onClose} currentDate="2020-05-01" />);

    fireEvent.change(screen.getByDisplayValue("2020-05-01"), { target: { value: "2021-06-15" } });
    fireEvent.click(screen.getByText("Submit for Approval"));

    await waitFor(() => expect(toastMock.error).toHaveBeenCalled());
    expect(onClose).not.toHaveBeenCalled();
  });

  it("treats a null currentDate as an empty starting value", async () => {
    mutateAsyncMock.mockResolvedValue({});
    render(<DegreeDateChangeModal isOpen onClose={vi.fn()} currentDate={null} />);
    const input = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(input, { target: { value: "2022-01-01" } });
    fireEvent.click(screen.getByText("Submit for Approval"));

    await waitFor(() =>
      expect(mutateAsyncMock).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: [expect.objectContaining({ before: null, after: "2022-01-01" })],
        }),
      ),
    );
  });
});
