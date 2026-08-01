import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ReviewVoucherModal from "@/components/modals/ReviewVoucherModal";

const { apiMock } = vi.hoisted(() => ({ apiMock: { put: vi.fn() } }));
vi.mock("@/lib/api", () => ({ default: apiMock }));

const voucher = {
  id: 1,
  voucher_number: "V-001",
  amount: 1000,
  vat: 150,
  sp_company_name: "Acme Corp",
  sp_first_name: "John",
  sp_last_name: "Doe",
  description: "Consulting fee",
} as any;

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

  it("shows voucher details", () => {
    render(<ReviewVoucherModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} voucher={voucher} />);
    expect(screen.getByText("Review Voucher V-001")).toBeInTheDocument();
    expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
    expect(screen.getByText(/Consulting fee/)).toBeInTheDocument();
  });

  it("approves without requiring a comment", async () => {
    apiMock.put.mockResolvedValue({});
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    render(<ReviewVoucherModal isOpen onClose={onClose} onSuccess={onSuccess} voucher={voucher} />);

    fireEvent.click(screen.getByText("Submit"));
    await waitFor(() =>
      expect(apiMock.put).toHaveBeenCalledWith("/vouchers/1/reviews", { action: "approve", comment: undefined }),
    );
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("requires a comment for reject and information_request actions", async () => {
    render(<ReviewVoucherModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} voucher={voucher} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "reject" } });
    fireEvent.click(screen.getByText("Submit"));

    await waitFor(() =>
      expect(screen.getByText("Comment is required for Reject and Information Request")).toBeInTheDocument(),
    );
    expect(apiMock.put).not.toHaveBeenCalled();
  });

  it("submits a reject with a comment successfully", async () => {
    apiMock.put.mockResolvedValue({});
    render(<ReviewVoucherModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} voucher={voucher} />);
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "reject" } });
    fireEvent.change(screen.getByPlaceholderText(/Required for Reject/), { target: { value: "Missing receipts" } });
    fireEvent.click(screen.getByText("Submit"));

    await waitFor(() =>
      expect(apiMock.put).toHaveBeenCalledWith("/vouchers/1/reviews", {
        action: "reject",
        comment: "Missing receipts",
      }),
    );
  });

  it("shows the server error message when the request fails", async () => {
    apiMock.put.mockRejectedValue({ response: { data: { message: "Server exploded" } } });
    render(<ReviewVoucherModal isOpen onClose={vi.fn()} onSuccess={vi.fn()} voucher={voucher} />);
    fireEvent.click(screen.getByText("Submit"));
    await waitFor(() => expect(screen.getByText("Server exploded")).toBeInTheDocument());
  });
});
