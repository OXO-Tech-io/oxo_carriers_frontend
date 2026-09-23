import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import MedicalInsurancePage from "@/app/(dashboard)/medical-insurance/page";

const { apiMock } = vi.hoisted(() => ({
  apiMock: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
}));

vi.mock("@/lib/api", () => ({ default: apiMock }));

function claimRow(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: 1,
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
    ...overrides,
  };
}

function mockDataEndpoints(claims: any[] = [claimRow()]) {
  apiMock.get.mockImplementation((url: string) => {
    if (url === "/medical-insurance-claims") return Promise.resolve({ data: { claims } });
    if (url === "/medical-insurance-claims/limits") {
      return Promise.resolve({ data: { limits: { IN: { maxPerClaim: 300000 }, OPD: { maxPerQuarter: 6000, yearlyTotal: 24000 } }, currentQuarter: "2026-Q3" } });
    }
    if (url === "/medical-insurance-claims/opd-balance") {
      return Promise.resolve({ data: { quarter: "2026-Q3", limit: 6000, used: 4000, remaining: 2000 } });
    }
    return Promise.reject(new Error(`Unexpected GET ${url}`));
  });
}

describe("MedicalInsurancePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDataEndpoints();
  });

  it("requests only the caller's own claims (OCD-488)", async () => {
    render(<MedicalInsurancePage />);
    await waitFor(() =>
      expect(apiMock.get).toHaveBeenCalledWith("/medical-insurance-claims", { params: { mine: true } }),
    );
  });

  it("shows a Cancel Claim action for a pending claim and confirms before cancelling (OCD-486)", async () => {
    render(<MedicalInsurancePage />);
    await screen.findAllByText("Out-patient (OPD)");

    // Both the desktop table and mobile card views render in jsdom (no real
    // media queries), so the same action appears twice - either one drives the
    // same handler.
    fireEvent.click(screen.getAllByRole("button", { name: /Cancel Claim/i })[0]);
    expect(apiMock.put).not.toHaveBeenCalled();

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: "Cancel Claim" })).toBeInTheDocument();

    apiMock.put.mockResolvedValue({ data: { success: true } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Cancel Claim" }));

    await waitFor(() => expect(apiMock.put).toHaveBeenCalledWith("/medical-insurance-claims/1/cancel"));
  });

  it("does not show a Cancel Claim action for an approved claim", async () => {
    mockDataEndpoints([claimRow({ status: "approved" })]);
    render(<MedicalInsurancePage />);
    await screen.findAllByText("Out-patient (OPD)");
    expect(screen.queryByRole("button", { name: /Cancel Claim/i })).not.toBeInTheDocument();
  });

  it("caps the OPD claim amount to the employee's remaining quarterly balance (OCD-487)", async () => {
    render(<MedicalInsurancePage />);
    await screen.findAllByText("Out-patient (OPD)");

    fireEvent.click(screen.getByRole("button", { name: "New Claim" }));
    fireEvent.change(await screen.findByRole("combobox"), { target: { value: "OPD" } });

    await screen.findByText(/Your OPD Balance/i);
    expect(screen.getByText(/Maximum Allowed: LKR 2,000.00/)).toBeInTheDocument();

    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "2500" } });
    expect(screen.getByText(/Entered amount exceeds your remaining quarterly OPD claim balance/)).toBeInTheDocument();
  });
});
