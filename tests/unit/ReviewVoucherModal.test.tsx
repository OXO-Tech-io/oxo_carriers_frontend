import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ReviewVoucherModal from "@/components/modals/ReviewVoucherModal";
import { VoucherStatus } from "@/types";

const { apiMock } = vi.hoisted(() => ({ apiMock: { put: vi.fn() } }));
vi.mock("@/lib/api", () => ({ default: apiMock }));

const voucher = {
  id: 1,
  voucher_number: "V-001",
  status: VoucherStatus.PENDING_MANAGER_REVIEW,
  amount: 1000,
  vat: 150,
  sp_company_name: "Acme Corp",
  sp_first_name: "John",
  sp_last_name: "Doe",
  description: "Consulting fee",
  invoice_url: null,
  created_by_first_name: "Eve",
  created_by_last_name: "Executive",
} as any;

const adminStageVoucher = {
  ...voucher,
  status: VoucherStatus.PENDING_ADMIN_REVIEW,
  manager_reviewed_by_first_name: "Mia",
  manager_reviewed_by_last_name: "Manager",
};

describe("ReviewVoucherModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when closed or no voucher is provided", () => {
    const { container: c1 } = render(
      <ReviewVoucherModal isOpen={false} onClose={vi.fn()} onSuccess={vi.fn()} voucher={voucher} />,
    );
    expect(c1).toBeEmptyDOMElement();

    const { container: c2 } = render(
      <ReviewVoucherModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} voucher={null} />,
    );
    expect(c2).toBeEmptyDOMElement();
  });

  it("shows the financial breakdown and the bill state", () => {
    render(<ReviewVoucherModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} voucher={voucher} />);
    expect(screen.getByText("Review Voucher V-001")).toBeInTheDocument();
    expect(screen.getByText("Acme Corp")).toBeInTheDocument();
    expect(screen.getByText("Consulting fee")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText((1150).toLocaleString())).toBeInTheDocument();
    expect(screen.getByText("None attached")).toBeInTheDocument();
  });

  it("labels the stage and, for the Administrator, who approved it at the manager stage", () => {
    const { rerender } = render(
      <ReviewVoucherModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} voucher={voucher} />,
    );
    expect(screen.getByText("Finance Manager review")).toBeInTheDocument();
    expect(screen.queryByText("Approved by Finance Manager")).not.toBeInTheDocument();

    rerender(<ReviewVoucherModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} voucher={adminStageVoucher} />);
    expect(screen.getByText("Administrator approval (final)")).toBeInTheDocument();
    expect(screen.getByText("Mia Manager")).toBeInTheDocument();
  });

  it("only offers approve and reject (no information request)", () => {
    render(<ReviewVoucherModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} voucher={voucher} />);
    const values = Array.from(screen.getByRole("combobox").querySelectorAll("option")).map((o) =>
      o.getAttribute("value"),
    );
    expect(values).toEqual(["approve", "reject"]);
  });

  it("approves without a comment and does not show the reason box", async () => {
    apiMock.put.mockResolvedValue({});
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    render(<ReviewVoucherModal isOpen onClose={onClose} onSuccess={onSuccess} voucher={voucher} />);

    expect(screen.queryByLabelText(/Rejection reason/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByText("Submit"));
    await waitFor(() =>
      expect(apiMock.put).toHaveBeenCalledWith("/vouchers/1/reviews", { action: "approve", comment: undefined }),
    );
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("requires a rejection reason, including whitespace-only input", async () => {
    render(<ReviewVoucherModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} voucher={voucher} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "reject" } });
    fireEvent.change(screen.getByLabelText(/Rejection reason/), { target: { value: "   " } });
    fireEvent.click(screen.getByText("Submit"));

    await waitFor(() => expect(screen.getByText("A rejection reason is required")).toBeInTheDocument());
    expect(apiMock.put).not.toHaveBeenCalled();
  });

  it("submits a rejection with the trimmed reason", async () => {
    apiMock.put.mockResolvedValue({});
    render(<ReviewVoucherModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} voucher={voucher} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "reject" } });
    fireEvent.change(screen.getByLabelText(/Rejection reason/), {
      target: { value: "  Inadequate supporting invoice details provided " },
    });
    fireEvent.click(screen.getByText("Submit"));

    await waitFor(() =>
      expect(apiMock.put).toHaveBeenCalledWith("/vouchers/1/reviews", {
        action: "reject",
        comment: "Inadequate supporting invoice details provided",
      }),
    );
  });

  it("does not send a typed reason when the action is switched back to approve", async () => {
    apiMock.put.mockResolvedValue({});
    render(<ReviewVoucherModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} voucher={voucher} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "reject" } });
    fireEvent.change(screen.getByLabelText(/Rejection reason/), { target: { value: "oops" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "approve" } });
    fireEvent.click(screen.getByText("Submit"));

    await waitFor(() =>
      expect(apiMock.put).toHaveBeenCalledWith("/vouchers/1/reviews", { action: "approve", comment: undefined }),
    );
  });

  it("shows the server error message when the request fails", async () => {
    apiMock.put.mockRejectedValue({ response: { data: { message: "Server exploded" } } });
    render(<ReviewVoucherModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} voucher={voucher} />);
    fireEvent.click(screen.getByText("Submit"));
    await waitFor(() => expect(screen.getByText("Server exploded")).toBeInTheDocument());
  });
});
