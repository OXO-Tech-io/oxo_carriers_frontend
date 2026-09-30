import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import AdminMedicalInsurancePage from "@/app/admin/medical-insurance/page";

const { apiMock, useAuthMock } = vi.hoisted(() => ({
  apiMock: { get: vi.fn(), put: vi.fn() },
  useAuthMock: vi.fn(),
}));

vi.mock("@/lib/api", () => ({ default: apiMock }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: useAuthMock }));

function claimRow(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: 1,
    user_id: 10,
    type: "OPD",
    quarter: "2026-Q3",
    amount: 3000,
    status: "pending",
    supportive_document_url: "/uploads/documents/doc.pdf",
    relevant_document_url: null,
    admin_comment: null,
    resubmission_of: null,
    payment_status: "not_paid",
    created_at: "2026-09-01T00:00:00.000Z",
    user: { id: 10, first_name: "Jane", last_name: "Doe", email: "jane@oxo.test", employee_id: "EMP1" },
    ...overrides,
  };
}

describe("AdminMedicalInsurancePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthMock.mockReturnValue({ isHR: true, isFinance: false, isSuperAdmin: false });
  });

  it("shows a permission message for a role without access", () => {
    useAuthMock.mockReturnValue({ isHR: false, isFinance: false, isSuperAdmin: false });
    apiMock.get.mockResolvedValue({ data: { claims: [] } });
    render(<AdminMedicalInsurancePage />);
    expect(screen.getByText("You don't have permission to access this page.")).toBeInTheDocument();
  });

  it("requires confirmation before approving a pending claim (OCD-492)", async () => {
    apiMock.get.mockResolvedValue({ data: { claims: [claimRow()] } });
    render(<AdminMedicalInsurancePage />);

    // The first claim in the list is auto-selected into the detail panel.
    const detail = await screen.findByTestId("claim-detail");
    await within(detail).findByText("Jane Doe");
    fireEvent.click(within(detail).getByRole("button", { name: /Approve/i }));

    // Approving is not called until the confirmation dialog is confirmed.
    expect(apiMock.put).not.toHaveBeenCalled();
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("Approve Claim")).toBeInTheDocument();

    apiMock.put.mockResolvedValue({ data: { success: true } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Approve" }));

    await waitFor(() =>
      expect(apiMock.put).toHaveBeenCalledWith("/medical-insurance-claims/1/decisions", { action: "approve" }),
    );
  });

  it("only requests approved claims and hides the status filter, Approve and Reject for Finance (OCD-582)", async () => {
    useAuthMock.mockReturnValue({ isHR: false, isFinance: true, isSuperAdmin: false });
    apiMock.get.mockResolvedValue({ data: { claims: [claimRow({ status: "pending" })] } });
    render(<AdminMedicalInsurancePage />);

    const detail = await screen.findByTestId("claim-detail");
    await within(detail).findByText("Jane Doe");
    expect(apiMock.get).toHaveBeenCalledWith("/medical-insurance-claims?status=approved");
    expect(screen.queryByText("Status", { selector: "label" })).not.toBeInTheDocument();
    expect(within(detail).queryByRole("button", { name: /Approve/i })).not.toBeInTheDocument();
    expect(within(detail).queryByRole("button", { name: /Reject/i })).not.toBeInTheDocument();
  });

  it("hides payment actions from HR on an approved claim (OCD-583)", async () => {
    apiMock.get.mockResolvedValue({ data: { claims: [claimRow({ status: "approved" })] } });
    render(<AdminMedicalInsurancePage />);

    const detail = await screen.findByTestId("claim-detail");
    await within(detail).findByText("Jane Doe");
    expect(within(detail).queryByRole("button", { name: /Record Payment|Update Payment/i })).not.toBeInTheDocument();
  });

  it("caps the payment date at today, blocks future dates and shows the saved date without a time (OCD-584)", async () => {
    useAuthMock.mockReturnValue({ isHR: false, isFinance: true, isSuperAdmin: false });
    apiMock.get.mockResolvedValue({
      data: { claims: [claimRow({ status: "approved", payment_status: "paid", paid_amount: 3000, payment_date: "2026-09-20" })] },
    });
    render(<AdminMedicalInsurancePage />);

    const detail = await screen.findByTestId("claim-detail");
    await within(detail).findByText("Jane Doe");
    expect(within(detail).getByText("2026-09-20")).toBeInTheDocument();

    fireEvent.click(within(detail).getByRole("button", { name: /Update Payment/i }));
    const dateInput = detail.querySelector('input[type="date"]') as HTMLInputElement;
    expect(dateInput.max).toBe(new Date().toLocaleDateString("en-CA"));

    fireEvent.change(dateInput, { target: { value: "2999-01-01" } });
    fireEvent.click(within(detail).getByRole("button", { name: /Save Payment/i }));
    expect(await screen.findByText("Payment Date cannot be in the future")).toBeInTheDocument();
    expect(apiMock.put).not.toHaveBeenCalled();
  });

  it("shows the rejection reason to HR/Admin after a claim is rejected (OCD-491)", async () => {
    apiMock.get.mockResolvedValue({
      data: { claims: [claimRow({ status: "rejected", admin_comment: "Missing itemized bill" })] },
    });
    render(<AdminMedicalInsurancePage />);

    const detail = await screen.findByTestId("claim-detail");
    await within(detail).findByText("Jane Doe");
    expect(within(detail).getByText("Rejection Reason")).toBeInTheDocument();
    expect(within(detail).getByText("Missing itemized bill")).toBeInTheDocument();
  });
});
