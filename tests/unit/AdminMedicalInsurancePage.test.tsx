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

    await screen.findByText("Jane Doe");
    fireEvent.click(screen.getByRole("button", { name: /Approve/i }));

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

  it("shows the rejection reason to HR/Admin after a claim is rejected (OCD-491)", async () => {
    apiMock.get.mockResolvedValue({
      data: { claims: [claimRow({ status: "rejected", admin_comment: "Missing itemized bill" })] },
    });
    render(<AdminMedicalInsurancePage />);

    await screen.findByText("Jane Doe");
    expect(screen.getByText(/Rejection reason:/)).toBeInTheDocument();
    expect(screen.getByText("Missing itemized bill")).toBeInTheDocument();
  });
});
