import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import VoucherPaymentTracker from "@/components/vouchers/VoucherPaymentTracker";
import { VoucherPaymentStatus, VoucherStatus } from "@/types";
import { getVoucherPaymentStatusLabel, getVoucherStatusLabel } from "@/lib/voucherStatus";

const base = {
  id: 5,
  voucher_number: "VOU-2026-0005",
  status: VoucherStatus.APPROVED,
  payment_status: VoucherPaymentStatus.UNPAID,
} as any;

function setup(voucher: any, overrides: Partial<React.ComponentProps<typeof VoucherPaymentTracker>> = {}) {
  const onMarkUploaded = vi.fn();
  const onMarkPaid = vi.fn();
  const onRevert = vi.fn();
  render(
    <VoucherPaymentTracker
      voucher={voucher}
      canMarkUploaded
      canMarkPaid
      onMarkUploaded={onMarkUploaded}
      onMarkPaid={onMarkPaid}
      onRevert={onRevert}
      {...overrides}
    />,
  );
  return { onMarkUploaded, onMarkPaid, onRevert, slider: screen.getByRole("slider") };
}

const uploadedVoucher = {
  ...base,
  payment_status: VoucherPaymentStatus.UPLOADED_FOR_PAYMENT,
  bank_upload_at: "2026-11-05T09:30:00.000Z",
  bank_upload_by_first_name: "Eve",
  bank_upload_by_last_name: "Executive",
};

describe("VoucherPaymentTracker", () => {
  it("renders nothing for a voucher with no payment status", () => {
    const { container } = render(
      <VoucherPaymentTracker
        voucher={{ ...base, payment_status: null }}
        canMarkUploaded
        canMarkPaid
        onMarkUploaded={vi.fn()}
        onMarkPaid={vi.fn()}
        onRevert={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("Unpaid: one step right marks it Uploaded for Payment; Paid cannot be skipped to", async () => {
    const { slider, onMarkUploaded, onMarkPaid } = setup(base);
    expect(slider).toHaveAttribute("aria-valuetext", "Unpaid");

    fireEvent.keyDown(slider, { key: "End" });
    await act(async () => {});
    expect(onMarkUploaded).not.toHaveBeenCalled();
    expect(onMarkPaid).not.toHaveBeenCalled();
    expect(screen.queryByText("Mark as Paid")).not.toBeInTheDocument();

    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(onMarkUploaded).toHaveBeenCalledWith(5);
  });

  it("Uploaded for Payment: moving to Paid asks for confirmation first", () => {
    const { slider, onMarkPaid } = setup(uploadedVoucher);
    expect(slider).toHaveAttribute("aria-valuetext", "Uploaded for Payment");
    expect(screen.queryByText(/Eve Executive/)).not.toBeInTheDocument();
    fireEvent.mouseEnter(screen.getByRole("button", { name: "Payment details" }));
    expect(screen.getByRole("tooltip")).toHaveTextContent(/Uploaded · Eve Executive/);

    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(onMarkPaid).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Mark as Paid"));
    expect(onMarkPaid).toHaveBeenCalledWith(5);
  });

  it("Uploaded for Payment: one step back to Unpaid asks first, then reverts", () => {
    const { slider, onRevert, onMarkUploaded } = setup(uploadedVoucher);
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(onRevert).not.toHaveBeenCalled();
    expect(screen.getByText("Move back to Unpaid?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Move back to Unpaid" }));
    expect(onRevert).toHaveBeenCalledWith(5);
    expect(onMarkUploaded).not.toHaveBeenCalled();
  });

  it("Paid: one step back to Uploaded for Payment, but not a two-stage jump to Unpaid", async () => {
    const { slider, onRevert } = setup({ ...base, payment_status: VoucherPaymentStatus.PAID });
    fireEvent.keyDown(slider, { key: "Home" });
    await act(async () => {});
    expect(screen.queryByText(/Move back to/)).not.toBeInTheDocument();
    expect(onRevert).not.toHaveBeenCalled();

    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(screen.getByText("Move back to Uploaded for Payment?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Move back to Uploaded for Payment" }));
    expect(onRevert).toHaveBeenCalledWith(5);
  });

  it("cancelling the move-back dialog changes nothing", () => {
    const { slider, onRevert } = setup(uploadedVoucher);
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onRevert).not.toHaveBeenCalled();
  });

  it("Paid stays editable (not locked) and shows who/when in the tooltip", () => {
    const { slider } = setup({
      ...base,
      payment_status: VoucherPaymentStatus.PAID,
      paid_at: "2026-11-06T09:30:00.000Z",
      paid_by_first_name: "Pat",
      paid_by_last_name: "Payer",
    });
    expect(slider).toHaveAttribute("aria-valuetext", "Paid");
    expect(slider).toHaveAttribute("aria-disabled", "false");
    fireEvent.focus(screen.getByRole("button", { name: "Payment details" }));
    expect(screen.getByRole("tooltip")).toHaveTextContent(/Paid · Pat Payer/);
  });

  it("an Unpaid voucher cannot be moved back", () => {
    const { slider, onRevert } = setup(base);
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(onRevert).not.toHaveBeenCalled();
  });

  it("users without the permissions cannot move to the next stage", () => {
    const { slider, onMarkUploaded } = setup(base, { canMarkUploaded: false });
    expect(slider).toHaveAttribute("aria-disabled", "true");
    fireEvent.keyDown(slider, { key: "ArrowRight" });
    expect(onMarkUploaded).not.toHaveBeenCalled();

    const second = render(
      <VoucherPaymentTracker
        voucher={{ ...uploadedVoucher, id: 6 }}
        canMarkUploaded
        canMarkPaid={false}
        onMarkUploaded={vi.fn()}
        onMarkPaid={vi.fn()}
        onRevert={vi.fn()}
      />,
    );
    // Can still move back (needs only the upload permission) but not forward to Paid.
    fireEvent.keyDown(second.getAllByRole("slider")[1], { key: "ArrowRight" });
    expect(screen.queryByText("Mark as Paid")).not.toBeInTheDocument();
  });

  it("undoing a stage needs the permission for that stage", () => {
    // Paid -> Uploaded needs canMarkPaid, even if the user can mark uploaded.
    const { slider, onRevert } = setup(
      { ...base, payment_status: VoucherPaymentStatus.PAID },
      { canMarkUploaded: true, canMarkPaid: false },
    );
    expect(slider).toHaveAttribute("aria-disabled", "true");
    fireEvent.keyDown(slider, { key: "ArrowLeft" });
    expect(onRevert).not.toHaveBeenCalled();
  });

  it("shows no info icon while there is nothing to report", () => {
    setup(base);
    expect(screen.queryByRole("button", { name: "Payment details" })).not.toBeInTheDocument();
  });

  it("hides the tooltip again when the pointer leaves", () => {
    setup(uploadedVoucher);
    const icon = screen.getByRole("button", { name: "Payment details" });
    fireEvent.mouseEnter(icon);
    fireEvent.mouseLeave(icon);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("locks the slider while a request is in flight", () => {
    const { slider } = setup(base, { busy: true });
    expect(slider).toHaveAttribute("aria-disabled", "true");
  });
});

describe("voucher status labels", () => {
  it("uses the spec's wording", () => {
    expect(getVoucherStatusLabel(VoucherStatus.PENDING_MANAGER_REVIEW)).toBe("Pending Finance Manager Review");
    expect(getVoucherStatusLabel(VoucherStatus.PENDING_ADMIN_REVIEW)).toBe("Pending Administrator Review");
    expect(getVoucherPaymentStatusLabel(VoucherPaymentStatus.UNPAID)).toBe("Unpaid");
    expect(getVoucherPaymentStatusLabel(VoucherPaymentStatus.UPLOADED_FOR_PAYMENT)).toBe("Uploaded for Payment");
    expect(getVoucherPaymentStatusLabel(VoucherPaymentStatus.PAID)).toBe("Paid");
  });

  it("falls back to the raw value for an unknown status", () => {
    expect(getVoucherStatusLabel("pending_review" as any)).toBe("pending_review");
  });
});
