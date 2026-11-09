"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { voucherService } from "@/lib/services/voucher.service";
import { motion, AnimatePresence } from "framer-motion";
import {
  Banknote,
  Plus,
  MessageSquare,
  Download,
  AlertTriangle,
  User,
  ExternalLink,
} from "lucide-react";
import { PaymentVoucher, VoucherPaymentStatus, VoucherStatus } from "@/types";
import CreateVoucherModal from "@/components/modals/CreateVoucherModal";
import ReviewVoucherModal from "@/components/modals/ReviewVoucherModal";
import VoucherPaymentTracker from "@/components/vouchers/VoucherPaymentTracker";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { API_FILE_BASE_URL as apiBaseUrl } from "@/lib/constants";
import {
  VOUCHER_PAYMENT_STATUS_LABELS,
  VOUCHER_STATUS_LABELS,
  getVoucherStatusLabel,
  getVoucherStatusStyle,
} from "@/lib/voucherStatus";

const PERMISSIONS = {
  VIEW: "vouchers.view",
  CREATE: "vouchers.create",
  REVIEW: "vouchers.review",
  ADMIN_REVIEW: "vouchers.admin_review",
  BANK_UPLOAD: "vouchers.bank_upload",
  MARK_PAID: "vouchers.mark_paid",
} as const;

type AccessLevel = "read" | "write";

const STATUS_OPTIONS: { value: VoucherStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  ...Object.values(VoucherStatus).map((value) => ({
    value,
    label: VOUCHER_STATUS_LABELS[value],
  })),
];

const PAYMENT_STATUS_OPTIONS: { value: VoucherPaymentStatus | ""; label: string }[] = [
  { value: "", label: "All Payment States" },
  ...Object.values(VoucherPaymentStatus).map((value) => ({
    value,
    label: VOUCHER_PAYMENT_STATUS_LABELS[value],
  })),
];

function isKnown<T extends string>(values: T[], value: string | null): value is T {
  return value !== null && (values as string[]).includes(value);
}

function personName(first?: string, last?: string) {
  return `${first || ""} ${last || ""}`.trim();
}

/** What the "Notes" column / card shows: the mandatory rejection reason, or who approved. */
function voucherNote(v: PaymentVoucher): { tone: "error" | "info"; text: string } | null {
  if (v.status === VoucherStatus.REJECTED && v.rejection_reason) {
    const by = personName(v.rejected_by_first_name, v.rejected_by_last_name);
    return { tone: "error", text: by ? `${v.rejection_reason} (rejected by ${by})` : v.rejection_reason };
  }
  if (v.status === VoucherStatus.PENDING_ADMIN_REVIEW) {
    const by = personName(v.manager_reviewed_by_first_name, v.manager_reviewed_by_last_name);
    if (by) return { tone: "info", text: `Approved by Finance Manager ${by}` };
  }
  if (v.status === VoucherStatus.APPROVED) {
    const by = personName(v.admin_reviewed_by_first_name, v.admin_reviewed_by_last_name);
    if (by) return { tone: "info", text: `Approved by ${by}` };
  }
  return null;
}

export default function VouchersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center min-h-96 items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[var(--primary)] border-t-transparent" />
        </div>
      }
    >
      <VoucherPageContent />
    </Suspense>
  );
}

function VoucherPageContent() {
  const { user, isFinanceManager, isFinanceExecutive, isSuperAdmin } = useAuth();
  const [vouchers, setVouchers] = useState<PaymentVoucher[]>([]);
  const [permissionLevels, setPermissionLevels] = useState<
    Record<string, AccessLevel>
  >({});
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [permissionError, setPermissionError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filterStatus, setFilterStatus] = useState<VoucherStatus | "">("");
  const [filterPayment, setFilterPayment] = useState<VoucherPaymentStatus | "">("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<PaymentVoucher | null>(
    null,
  );
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const paymentParam = searchParams.get("payment_status");

  const hasPermission = (key: string, level: AccessLevel = "read") => {
    const assigned = permissionLevels[key];
    if (!assigned) {
      return false;
    }

    if (assigned === "write") {
      return true;
    }

    return level === "read" && assigned === "read";
  };

  const permissionActionKeys = Object.values(PERMISSIONS);

  const canCreate =
    isSuperAdmin ||
    isFinanceManager ||
    isFinanceExecutive ||
    hasPermission(PERMISSIONS.CREATE, "write");
  // Finance Manager stage (vouchers created by Finance Executives).
  const canManagerReview =
    isSuperAdmin || isFinanceManager || hasPermission(PERMISSIONS.REVIEW, "write");
  // Administrator stage (final approval).
  const canAdminReview =
    isSuperAdmin || hasPermission(PERMISSIONS.ADMIN_REVIEW, "write");
  const canMarkUploaded =
    isSuperAdmin || isFinanceExecutive || hasPermission(PERMISSIONS.BANK_UPLOAD, "write");
  const canMarkPaid =
    isSuperAdmin || isFinanceExecutive || hasPermission(PERMISSIONS.MARK_PAID, "write");
  const canAccess =
    isSuperAdmin ||
    isFinanceManager ||
    isFinanceExecutive ||
    permissionActionKeys.some((key) => hasPermission(key, "read"));

  const canReviewVoucher = (v: PaymentVoucher) => {
    if (v.status === VoucherStatus.PENDING_MANAGER_REVIEW) return canManagerReview;
    if (v.status === VoucherStatus.PENDING_ADMIN_REVIEW) return canAdminReview;
    return false;
  };

  useEffect(() => {
    const fetchPermissions = async () => {
      if (!user) {
        setPermissionLevels({});
        setPermissionError("");
        setPermissionLoading(false);
        return;
      }

      try {
        setPermissionLoading(true);
        const res = await api.get("/permissions/me");
        setPermissionError("");
        if (
          res.data?.permissionLevels &&
          typeof res.data.permissionLevels === "object"
        ) {
          setPermissionLevels(
            res.data.permissionLevels as Record<string, AccessLevel>,
          );
        } else if (Array.isArray(res.data?.assignments)) {
          const nextLevels: Record<string, AccessLevel> = {};
          res.data.assignments.forEach((item: any) => {
            if (
              item &&
              typeof item.key === "string" &&
              (item.accessLevel === "read" || item.accessLevel === "write")
            ) {
              nextLevels[item.key] = item.accessLevel;
            }
          });
          setPermissionLevels(nextLevels);
        } else {
          setPermissionLevels({});
        }
      } catch (err: any) {
        setPermissionError(
          err.response?.data?.message || "Failed to load your permissions",
        );
        setPermissionLevels({});
      } finally {
        setPermissionLoading(false);
      }
    };

    fetchPermissions();
  }, [user]);

  // Sidebar links drive the filters through the URL; ignore values we don't know
  // (e.g. a bookmark of an old status) instead of sending them to the API.
  useEffect(() => {
    setFilterStatus(isKnown(Object.values(VoucherStatus), statusParam) ? statusParam : "");
    setFilterPayment(
      isKnown(Object.values(VoucherPaymentStatus), paymentParam) ? paymentParam : "",
    );
  }, [statusParam, paymentParam]);

  useEffect(() => {
    if (!permissionLoading && canAccess) fetchVouchers();
  }, [canAccess, filterStatus, filterPayment, permissionLoading]);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      setError("");
      // The Administrator's approval queue has its own endpoint.
      const isApprovalQueue =
        canAdminReview && filterStatus === VoucherStatus.PENDING_ADMIN_REVIEW && !filterPayment;
      let endpoint = "/vouchers/approval-queue";
      if (!isApprovalQueue) {
        const params = new URLSearchParams();
        if (filterStatus) params.append("status", filterStatus);
        if (filterPayment) params.append("payment_status", filterPayment);
        const qs = params.toString();
        endpoint = qs ? `/vouchers?${qs}` : "/vouchers";
      }
      const res = await api.get(endpoint);
      setVouchers(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load vouchers");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    setSuccess("Voucher created successfully.");
    fetchVouchers();
  };

  const handleReviewSuccess = () => {
    setSuccess("Review submitted.");
    setShowReviewModal(false);
    setSelectedVoucher(null);
    fetchVouchers();
  };

  const handleMarkUploaded = async (id: number) => {
    setActioningId(id);
    setError("");
    try {
      await api.put(`/vouchers/${id}/bank-uploads`);
      setSuccess("Marked as Uploaded for Payment.");
      fetchVouchers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to mark uploaded for payment");
    } finally {
      setActioningId(null);
    }
  };

  const handleMarkPaid = async (id: number) => {
    setActioningId(id);
    setError("");
    try {
      await api.put(`/vouchers/${id}/payments`);
      setSuccess("Voucher marked as Paid.");
      fetchVouchers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to mark paid");
    } finally {
      setActioningId(null);
    }
  };

  const handleRevertPayment = async (id: number) => {
    setActioningId(id);
    setError("");
    try {
      await api.put(`/vouchers/${id}/payment-reversals`);
      setSuccess("Payment status moved back one stage.");
      fetchVouchers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to move payment status back");
    } finally {
      setActioningId(null);
    }
  };

  const handleExportApprovedUnpaid = async () => {
    setExporting(true);
    setError("");
    try {
      const blob = await voucherService.downloadApprovedUnpaidExport();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `approved-unpaid-vouchers-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to download the Excel file");
    } finally {
      setExporting(false);
    }
  };

  const openReview = (v: PaymentVoucher) => {
    setSelectedVoucher(v);
    setShowReviewModal(true);
  };

  if (permissionLoading) {
    return (
      <div className="flex justify-center min-h-96 items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Card className="text-center max-w-md p-8 border-[var(--gray-100)] shadow-md">
          <AlertTriangle className="h-10 w-10 text-[var(--error)] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[var(--foreground)] tracking-tight">Access Denied</h3>
          <p className="text-xs text-[var(--gray-400)] mt-1.5 leading-relaxed">
            You do not have the required permissions to access the payment vouchers module.
          </p>
          {permissionError && (
            <p className="text-[var(--error-text)] text-[10px] bg-[var(--error-light)] p-2 rounded-lg mt-4 font-semibold">
              {permissionError}
            </p>
          )}
        </Card>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.35,
        when: "beforeChildren",
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const renderPaymentTracker = (v: PaymentVoucher) =>
    v.status === VoucherStatus.APPROVED && v.payment_status ? (
      <VoucherPaymentTracker
        voucher={v}
        canMarkUploaded={canMarkUploaded}
        canMarkPaid={canMarkPaid}
        busy={actioningId === v.id}
        onMarkUploaded={handleMarkUploaded}
        onMarkPaid={handleMarkPaid}
        onRevert={handleRevertPayment}
      />
    ) : (
      <span className="text-xs text-[var(--gray-300)]">-</span>
    );

  let content: React.ReactNode;
  if (loading) {
    content = (
      <div className="flex justify-center min-h-64 items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--primary)] border-t-transparent" />
      </div>
    );
  } else if (vouchers.length === 0) {
    content = (
      <Card padding="lg" className="text-center p-16 shadow-sm border-[var(--gray-100)] max-w-lg mx-auto">
        <Banknote className="h-12 w-12 text-[var(--gray-300)] mx-auto mb-4" />
        <h3 className="text-sm font-bold text-[var(--foreground)] mb-1">No payment vouchers found</h3>
        <p className="text-xs text-[var(--gray-400)] mb-5">Voucher requests will show up here once created.</p>
        {canCreate && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white cursor-pointer text-xs"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            Create Your First Voucher
          </Button>
        )}
      </Card>
    );
  } else {
    content = (
      <div className="space-y-6">
        {/* Desktop View Table */}
        <div className="hidden lg:block">
          <Card padding="none" className="overflow-hidden shadow-[var(--shadow-md)] border-[var(--gray-100)]">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[var(--gray-100)]">
                <thead className="bg-[var(--gray-25)]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Voucher #</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Service Provider</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">VAT</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Bill</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Created By</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Notes</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-[var(--card-bg)] divide-y divide-[var(--gray-100)]">
                  {vouchers.map((v) => {
                    const note = voucherNote(v);
                    return (
                      <tr key={v.id} className="hover:bg-[var(--gray-25)] transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[var(--foreground)]">
                          {v.voucher_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[var(--gray-600)]">
                          {v.sp_company_name ||
                            personName(v.sp_first_name, v.sp_last_name) ||
                            "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-[var(--foreground)]">
                          {Number(v.amount).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[var(--gray-500)]">
                          {Number(v.vat).toLocaleString()}
                        </td>
                        <td
                          className="px-6 py-4 text-sm text-[var(--gray-400)] max-w-[180px] truncate"
                          title={v.description || ""}
                        >
                          {v.description || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {v.invoice_url ? (
                            <a
                              href={`${apiBaseUrl}${v.invoice_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline"
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span>View</span>
                            </a>
                          ) : (
                            <span className="text-xs text-[var(--gray-300)]">No bill</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getVoucherStatusStyle(v.status)}`}>
                            {getVoucherStatusLabel(v.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{renderPaymentTracker(v)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-[var(--gray-500)]">
                          {personName(v.created_by_first_name, v.created_by_last_name)}
                        </td>
                        <td className="px-6 py-4 text-xs max-w-[220px]">
                          {note ? (
                            <span
                              className={`inline-flex items-start gap-1 ${
                                note.tone === "error" ? "text-[var(--error-text)]" : "text-[var(--gray-400)]"
                              }`}
                              title={note.text}
                            >
                              <MessageSquare className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[var(--gray-300)]" />
                              <span className="line-clamp-2">{note.text}</span>
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            {canReviewVoucher(v) && (
                              <button
                                onClick={() => openReview(v)}
                                className="text-xs font-bold text-[var(--primary)] hover:underline cursor-pointer"
                              >
                                Review
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Mobile View: Wallet Tickets Layout */}
        <div className="lg:hidden flex flex-col gap-5">
          {vouchers.map((v) => {
            const note = voucherNote(v);
            const showReview = canReviewVoucher(v);

            return (
              <div
                key={v.id}
                className="relative bg-[var(--card-bg)] border border-[var(--gray-100)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Visual Side Notches to Look Like Ticket */}
                <div className="absolute top-[4.5rem] -left-2.5 w-5 h-5 rounded-full bg-[var(--background)] border-r border-[var(--gray-100)] z-10 pointer-events-none" />
                <div className="absolute top-[4.5rem] -right-2.5 w-5 h-5 rounded-full bg-[var(--background)] border-l border-[var(--gray-100)] z-10 pointer-events-none" />

                {/* Ticket Top Part: ID & Status */}
                <div className="p-5 pb-4.5 flex justify-between items-center gap-3 bg-[var(--gray-25)] border-b border-dashed border-[var(--gray-100)]">
                  <div>
                    <span className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider block">Voucher Number</span>
                    <span className="text-sm font-extrabold text-[var(--foreground)]">{v.voucher_number}</span>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider text-right ${getVoucherStatusStyle(v.status)}`}>
                    {getVoucherStatusLabel(v.status)}
                  </span>
                </div>

                {/* Ticket Bottom Part: Key Info */}
                <div className="p-5 flex flex-col gap-4">
                  {/* Grid details */}
                  <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-xs">
                    <div>
                      <p className="text-[10px] font-semibold text-[var(--gray-400)] mb-0.5">Service Provider</p>
                      <p className="font-bold text-[var(--foreground)] truncate">
                        {v.sp_company_name ||
                          personName(v.sp_first_name, v.sp_last_name) ||
                          "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-[var(--gray-400)] mb-0.5">Amount</p>
                      <p className="font-extrabold text-[var(--foreground)]">
                        LKR {Number(v.amount).toLocaleString()}
                        <span className="text-[10px] font-semibold text-[var(--gray-400)] block mt-0.5">
                          VAT: LKR {Number(v.vat).toLocaleString()}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-[var(--gray-400)] mb-0.5">Created By</p>
                      <p className="font-semibold text-[var(--gray-500)] flex items-center gap-1">
                        <User className="h-3 w-3 text-[var(--gray-300)]" />
                        <span>{personName(v.created_by_first_name, v.created_by_last_name)}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-[var(--gray-400)] mb-0.5">Bill</p>
                      {v.invoice_url ? (
                        <a
                          href={`${apiBaseUrl}${v.invoice_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-[var(--primary)] hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>View Bill</span>
                        </a>
                      ) : (
                        <span className="text-[var(--gray-300)] font-semibold">No bill</span>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  {v.description && (
                    <div className="p-3 bg-[var(--gray-25)] rounded-xl text-xs font-semibold text-[var(--gray-500)] border border-[var(--gray-50)]">
                      <p className="text-[9px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-1">Description</p>
                      <p className="font-medium text-[var(--gray-600)] leading-relaxed">{v.description}</p>
                    </div>
                  )}

                  {/* Rejection reason / approval info */}
                  {note && (
                    <div
                      className={`p-3 rounded-xl text-xs flex gap-2 border ${
                        note.tone === "error"
                          ? "bg-[var(--error-light)] text-[var(--error-text)] border-[var(--error-text)]/5"
                          : "bg-[var(--info-light)] text-[var(--info-text)] border-[var(--info-text)]/5"
                      }`}
                    >
                      <MessageSquare className="h-4 w-4 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-wider mb-0.5">
                          {note.tone === "error" ? "Rejection Reason" : "Approval"}
                        </p>
                        <p className="font-semibold leading-relaxed">{note.text}</p>
                      </div>
                    </div>
                  )}

                  {/* Payment tracking */}
                  {v.status === VoucherStatus.APPROVED && v.payment_status && (
                    <div className="pt-3.5 border-t border-[var(--gray-50)]">
                      <p className="text-[9px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">Payment</p>
                      {renderPaymentTracker(v)}
                    </div>
                  )}

                  {/* Action Bar */}
                  {showReview && (
                    <div className="pt-3.5 border-t border-[var(--gray-50)] flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full text-xs py-2 bg-[var(--primary)] cursor-pointer"
                        onClick={() => openReview(v)}
                      >
                        Review Voucher
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const isApprovalQueueView =
    canAdminReview && filterStatus === VoucherStatus.PENDING_ADMIN_REVIEW && !filterPayment;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12"
    >
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">
            {isApprovalQueueView ? "Voucher Approval Queue" : "Vouchers"}
          </h1>
          <p className="text-sm text-[var(--gray-400)] font-medium mt-1">
            {isApprovalQueueView
              ? "Vouchers awaiting your final approval or rejection."
              : "Payment vouchers: create, review, approve, and track payment."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
          {canAccess && (
            <Button
              variant="outline"
              onClick={handleExportApprovedUnpaid}
              isLoading={exporting}
              title="Download approved vouchers that are not paid yet (Unpaid and Uploaded for Payment)"
              className="cursor-pointer"
              leftIcon={<Download className="h-4 w-4" />}
            >
              Download Excel
            </Button>
          )}
          {canCreate && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-sm flex items-center justify-center cursor-pointer"
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Create Voucher
            </Button>
          )}
        </div>
      </div>

      {/* Notifications */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-[var(--error-light)] border-l-4 border-[var(--error)] text-[var(--error-text)] p-4 rounded-xl text-xs font-semibold"
          >
            {error}
          </motion.div>
        )}
        {permissionError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-[var(--warning-light)] border-l-4 border-[var(--warning)] text-[var(--warning-text)] p-4 rounded-xl text-xs font-semibold"
          >
            Permission Sync Issue: {permissionError}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-[var(--success-light)] border-l-4 border-[var(--success)] text-[var(--success-text)] p-4 rounded-xl text-xs font-semibold"
          >
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtering Section */}
      <div className="flex flex-wrap gap-4 items-end bg-[var(--card-bg)] border border-[var(--gray-100)] p-4 rounded-2xl shadow-sm">
        <div className="w-full sm:w-auto">
          <label
            htmlFor="voucher-status-filter"
            className="block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-1.5"
          >
            Filter Status
          </label>
          <select
            id="voucher-status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as VoucherStatus | "")}
            className="block w-full sm:min-w-[240px] px-3 py-2 border border-[var(--gray-100)] rounded-xl text-xs font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value} className="bg-[var(--card-bg)]">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-auto">
          <label
            htmlFor="voucher-payment-filter"
            className="block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-1.5"
          >
            Payment Status
          </label>
          <select
            id="voucher-payment-filter"
            value={filterPayment}
            onChange={(e) => setFilterPayment(e.target.value as VoucherPaymentStatus | "")}
            className="block w-full sm:min-w-[200px] px-3 py-2 border border-[var(--gray-100)] rounded-xl text-xs font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all cursor-pointer"
          >
            {PAYMENT_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || "all"} value={opt.value} className="bg-[var(--card-bg)]">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Content */}
      <motion.div variants={itemVariants}>
        {content}
      </motion.div>

      {showCreateModal && (
        <CreateVoucherModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
      {showReviewModal && (
        <ReviewVoucherModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedVoucher(null);
          }}
          onSuccess={handleReviewSuccess}
          voucher={selectedVoucher}
        />
      )}
    </motion.div>
  );
}
