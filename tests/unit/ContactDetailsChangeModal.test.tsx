import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ContactDetailsChangeModal from "@/components/modals/ContactDetailsChangeModal";

const { toastMock, mutateAsyncMock } = vi.hoisted(() => ({
  toastMock: { info: vi.fn(), success: vi.fn(), error: vi.fn() },
  mutateAsyncMock: vi.fn(),
}));

vi.mock("@/contexts/ToastContext", () => ({ useToast: () => toastMock }));
vi.mock("@/hooks/mutations/use-submit-profile-change-mutation", () => ({
  useSubmitProfileChangeMutation: () => ({ mutateAsync: mutateAsyncMock }),
}));

describe("ContactDetailsChangeModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pre-selects the current blood type", () => {
    render(<ContactDetailsChangeModal isOpen onClose={vi.fn()} pii={{ bloodType: "O+" } as any} />);
    expect(screen.getByRole("combobox")).toHaveValue("O+");
  });

  it("shows an info toast and skips the mutation when nothing changed", async () => {
    render(<ContactDetailsChangeModal isOpen onClose={vi.fn()} pii={{ bloodType: "O+" } as any} />);
    fireEvent.click(screen.getByText("Submit for Approval"));
    await waitFor(() => expect(toastMock.info).toHaveBeenCalled());
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it("submits a change request when the blood type changes and closes on success", async () => {
    mutateAsyncMock.mockResolvedValue({});
    const onClose = vi.fn();
    render(<ContactDetailsChangeModal isOpen onClose={onClose} pii={{ bloodType: "O+" } as any} />);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "A+" } });
    fireEvent.click(screen.getByText("Submit for Approval"));

    await waitFor(() =>
      expect(mutateAsyncMock).toHaveBeenCalledWith({
        changes: [
          {
            entityType: "employee_pii_field",
            field: "blood_type",
            operation: "update",
            before: "O+",
            after: "A+",
          },
        ],
      }),
    );
    await waitFor(() => expect(toastMock.success).toHaveBeenCalled());
    expect(onClose).toHaveBeenCalled();
  });

  it("shows an error toast when the mutation fails", async () => {
    mutateAsyncMock.mockRejectedValue(new Error("network"));
    render(<ContactDetailsChangeModal isOpen onClose={vi.fn()} pii={{ bloodType: "O+" } as any} />);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "A+" } });
    fireEvent.click(screen.getByText("Submit for Approval"));

    await waitFor(() => expect(toastMock.error).toHaveBeenCalled());
  });

  it("treats a missing pii record as an empty starting value", () => {
    render(<ContactDetailsChangeModal isOpen onClose={vi.fn()} pii={null} />);
    expect(screen.getByRole("combobox")).toHaveValue("");
  });
});
