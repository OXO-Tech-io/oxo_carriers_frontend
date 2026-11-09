"use client";

import { createPortal } from "react-dom";
import { useId, useState, type SyntheticEvent } from "react";
import { Info } from "lucide-react";
import { PaymentVoucher, VoucherPaymentStatus } from "@/types";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { StepSlider, type StepSliderOption } from "@/components/ui/StepSlider";

interface VoucherPaymentTrackerProps {
  voucher: PaymentVoucher;
  /** May move Unpaid <-> Uploaded for Payment. */
  canMarkUploaded: boolean;
  /** May move Uploaded for Payment <-> Paid. */
  canMarkPaid: boolean;
  busy?: boolean;
  onMarkUploaded: (id: number) => void;
  onMarkPaid: (id: number) => void;
  /** Moves the voucher back one payment stage (Paid -> Uploaded, Uploaded -> Unpaid). */
  onRevert: (id: number) => void;
}

// Track order follows the payment journey: Unpaid -> Uploaded for Payment -> Paid.
const PAYMENT_STEPS: StepSliderOption<VoucherPaymentStatus>[] = [
  {
    value: VoucherPaymentStatus.UNPAID,
    label: "Unpaid",
    color: "var(--gray-400)",
    labelClass: "text-[var(--gray-500)]",
  },
  {
    value: VoucherPaymentStatus.UPLOADED_FOR_PAYMENT,
    label: "Uploaded for Payment",
    color: "var(--warning)",
    labelClass: "text-[var(--warning-text)]",
  },
  {
    value: VoucherPaymentStatus.PAID,
    label: "Paid",
    color: "var(--success)",
    labelClass: "text-[var(--success-text)]",
  },
];

function formatWhen(value: string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
}

function who(first?: string, last?: string) {
  return `${first || ""} ${last || ""}`.trim();
}

/**
 * The payment-state slider for an approved voucher. The thumb is the voucher's
 * current state. It can move one stage forward or one stage back (never a skip),
 * by someone allowed to make the stage involved. Paid and moving back both ask
 * for confirmation. "Uploaded" and "Paid" show who set them and when.
 */
export default function VoucherPaymentTracker({
  voucher,
  canMarkUploaded,
  canMarkPaid,
  busy = false,
  onMarkUploaded,
  onMarkPaid,
  onRevert,
}: VoucherPaymentTrackerProps) {
  const [confirmPaid, setConfirmPaid] = useState(false);
  const [confirmRevert, setConfirmRevert] = useState(false);
  const [tip, setTip] = useState<{ top: number; left?: number; right?: number } | null>(null);
  const tipId = useId();
  const state = voucher.payment_status;
  if (!state) return null;

  const uploadedBy = who(voucher.bank_upload_by_first_name, voucher.bank_upload_by_last_name);
  const paidBy = who(voucher.paid_by_first_name, voucher.paid_by_last_name);
  const uploadedNote = voucher.bank_upload_at
    ? `${uploadedBy ? `${uploadedBy} · ` : ""}${formatWhen(voucher.bank_upload_at)}`
    : "";
  const paidNote = voucher.paid_at ? `${paidBy ? `${paidBy} · ` : ""}${formatWhen(voucher.paid_at)}` : "";

  // The one stage forward and the one stage back the signed-in user may move to.
  // Leaving a stage needs the permission for that stage (undoing Paid needs the
  // same permission as marking Paid).
  const nextStage =
    state === VoucherPaymentStatus.UNPAID && canMarkUploaded
      ? VoucherPaymentStatus.UPLOADED_FOR_PAYMENT
      : state === VoucherPaymentStatus.UPLOADED_FOR_PAYMENT && canMarkPaid
        ? VoucherPaymentStatus.PAID
        : null;
  const previousStage =
    state === VoucherPaymentStatus.PAID && canMarkPaid
      ? VoucherPaymentStatus.UPLOADED_FOR_PAYMENT
      : state === VoucherPaymentStatus.UPLOADED_FOR_PAYMENT && canMarkUploaded
        ? VoucherPaymentStatus.UNPAID
        : null;
  const revertTarget = state === VoucherPaymentStatus.PAID ? "Uploaded for Payment" : "Unpaid";

  const hasDetails = Boolean(uploadedNote || paidNote);
  const showTip = (e: SyntheticEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    // Open towards the middle of the screen so the tip never runs off an edge.
    setTip(
      r.left > window.innerWidth / 2
        ? { top: r.bottom + 6, right: window.innerWidth - r.right }
        : { top: r.bottom + 6, left: r.left },
    );
  };

  const handleChange = (target: VoucherPaymentStatus) => {
    // Anything but the single allowed step forward or back (a skip) is ignored and
    // the slider returns to the current stage.
    if (target === nextStage) {
      if (target === VoucherPaymentStatus.PAID) setConfirmPaid(true);
      else onMarkUploaded(voucher.id);
    } else if (target === previousStage) {
      setConfirmRevert(true);
    }
  };

  return (
    <>
      <div className="inline-flex items-center gap-2">
        <StepSlider
          ariaLabel={`Payment status of ${voucher.voucher_number}`}
          options={PAYMENT_STEPS}
          value={state}
          onChange={handleChange}
          disabled={busy || (nextStage === null && previousStage === null)}
        />
        {hasDetails && (
          <>
            <button
              type="button"
              aria-label="Payment details"
              aria-describedby={tip ? tipId : undefined}
              onMouseEnter={showTip}
              onFocus={showTip}
              onMouseLeave={() => setTip(null)}
              onBlur={() => setTip(null)}
              className="rounded-full text-[var(--gray-400)] transition-colors hover:text-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
            >
              <Info className="h-4 w-4" aria-hidden="true" />
            </button>
            {tip &&
              typeof document !== "undefined" &&
              // Portalled to <body> so no card, table or scroll container can clip it,
              // and a blur/transform on an ancestor cannot re-anchor "fixed".
              createPortal(
                <div
                  id={tipId}
                  role="tooltip"
                  style={{ position: "fixed", top: tip.top, left: tip.left, right: tip.right, maxWidth: "min(24rem, calc(100vw - 16px))" }}
                  className="pointer-events-none z-[9999] w-max space-y-1 whitespace-normal break-words rounded-lg bg-[#0A0B17] px-3 py-2 text-[11px] font-medium leading-snug text-white shadow-lg ring-1 ring-white/10"
                >
                  {uploadedNote && <p>Uploaded · {uploadedNote}</p>}
                  {paidNote && <p>Paid · {paidNote}</p>}
                </div>,
                document.body,
              )}
          </>
        )}
      </div>

      <ConfirmationDialog
        isOpen={confirmRevert}
        onClose={() => setConfirmRevert(false)}
        onConfirm={() => {
          setConfirmRevert(false);
          onRevert(voucher.id);
        }}
        title={`Move back to ${revertTarget}?`}
        message={`${voucher.voucher_number} will go back to ${revertTarget}. The ${
          state === VoucherPaymentStatus.PAID ? "payment" : "upload"
        } details recorded for it (who and when) will be cleared.`}
        confirmLabel={`Move back to ${revertTarget}`}
      />

      <ConfirmationDialog
        isOpen={confirmPaid}
        onClose={() => setConfirmPaid(false)}
        onConfirm={() => {
          setConfirmPaid(false);
          onMarkPaid(voucher.id);
        }}
        title="Mark voucher as Paid?"
        message={`Confirm the bank transfer for ${voucher.voucher_number} has been finalized. It can be moved back to Uploaded for Payment later if needed.`}
        confirmLabel="Mark as Paid"
      />
    </>
  );
}
