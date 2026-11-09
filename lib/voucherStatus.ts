import { VoucherPaymentStatus, VoucherStatus } from "@/types";

export const VOUCHER_STATUS_LABELS: Record<VoucherStatus, string> = {
  [VoucherStatus.PENDING_MANAGER_REVIEW]: "Pending Finance Manager Review",
  [VoucherStatus.PENDING_ADMIN_REVIEW]: "Pending Administrator Review",
  [VoucherStatus.APPROVED]: "Approved",
  [VoucherStatus.REJECTED]: "Rejected",
};

export const VOUCHER_PAYMENT_STATUS_LABELS: Record<VoucherPaymentStatus, string> = {
  [VoucherPaymentStatus.UNPAID]: "Unpaid",
  [VoucherPaymentStatus.UPLOADED_FOR_PAYMENT]: "Uploaded for Payment",
  [VoucherPaymentStatus.PAID]: "Paid",
};

export function getVoucherStatusLabel(status: VoucherStatus): string {
  return VOUCHER_STATUS_LABELS[status] ?? status;
}

export function getVoucherPaymentStatusLabel(status: VoucherPaymentStatus): string {
  return VOUCHER_PAYMENT_STATUS_LABELS[status] ?? status;
}

export function getVoucherStatusStyle(status: VoucherStatus): string {
  const map: Record<VoucherStatus, string> = {
    [VoucherStatus.PENDING_MANAGER_REVIEW]:
      "bg-[var(--warning-light)] text-[var(--warning-text)] border border-[var(--warning-text)]/10",
    [VoucherStatus.PENDING_ADMIN_REVIEW]:
      "bg-[var(--info-light)] text-[var(--info-text)] border border-[var(--info-text)]/10",
    [VoucherStatus.APPROVED]:
      "bg-[var(--success-light)] text-[var(--success-text)] border border-[var(--success-text)]/10",
    [VoucherStatus.REJECTED]:
      "bg-[var(--error-light)] text-[var(--error-text)] border border-[var(--error-text)]/10",
  };
  return map[status] || "bg-[var(--gray-50)] text-[var(--gray-500)]";
}

export function getVoucherPaymentStatusStyle(status: VoucherPaymentStatus): string {
  const map: Record<VoucherPaymentStatus, string> = {
    [VoucherPaymentStatus.UNPAID]:
      "bg-[var(--warning-light)] text-[var(--warning-text)] border border-[var(--warning-text)]/10",
    [VoucherPaymentStatus.UPLOADED_FOR_PAYMENT]:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/10",
    [VoucherPaymentStatus.PAID]:
      "bg-[var(--success-light)] text-[var(--success-text)] border border-[var(--success-text)]/10",
  };
  return map[status] || "bg-[var(--gray-50)] text-[var(--gray-500)]";
}
