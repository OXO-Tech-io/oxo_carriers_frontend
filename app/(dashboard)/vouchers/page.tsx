"use client";

import { useState, useEffect, Suspense } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Banknote,
  Plus,
  Upload,
  DollarSign,
  MessageSquare,
  Download,
  Eye,
  Calendar,
  AlertTriangle,
  User,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { PaymentVoucher, VoucherStatus } from "@/types";
import CreateVoucherModal from "@/components/modals/CreateVoucherModal";
import ReviewVoucherModal from "@/components/modals/ReviewVoucherModal";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const PERMISSIONS = {
  VIEW: "vouchers.view",
  CREATE: "vouchers.create",
  REVIEW: "vouchers.review",
  RESUBMIT: "vouchers.resubmit",
  BANK_UPLOAD: "vouchers.bank_upload",
  MARK_PAID: "vouchers.mark_paid",
} as const;

type AccessLevel = "read" | "write";

const STATUS_OPTIONS: { value: VoucherStatus | ""; label: string }[] = [
  { value: "", label: "All Statuses" },
  { value: VoucherStatus.PENDING_REVIEW, label: "Pending Review" },
  { value: VoucherStatus.APPROVED, label: "Approved" },
  { value: VoucherStatus.REJECTED, label: "Rejected" },
  { value: VoucherStatus.INFORMATION_REQUEST, label: "Info Request" },
  { value: VoucherStatus.BANK_UPLOAD, label: "Bank Upload" },
  { value: VoucherStatus.PAID, label: "Paid" },
];

function getStatusStyle(status: VoucherStatus) {
  const map: Record<VoucherStatus, string> = {
    [VoucherStatus.PENDING_REVIEW]: "bg-[var(--warning-light)] text-[var(--warning-text)] border border-[var(--warning-text)]/10",
    [VoucherStatus.APPROVED]: "bg-[var(--success-light)] text-[var(--success-text)] border border-[var(--success-text)]/10",
    [VoucherStatus.REJECTED]: "bg-[var(--error-light)] text-[var(--error-text)] border border-[var(--error-text)]/10",
    [VoucherStatus.INFORMATION_REQUEST]: "bg-[var(--info-light)] text-[var(--info-text)] border border-[var(--info-text)]/10",
    [VoucherStatus.BANK_UPLOAD]: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/10",
    [VoucherStatus.PAID]: "bg-[var(--gray-50)] text-[var(--gray-500)] border border-[var(--gray-100)]",
  };
  return map[status] || "bg-[var(--gray-50)] text-[var(--gray-500)]";
}

function getStatusLabel(status: VoucherStatus) {
  const labels: Record<VoucherStatus, string> = {
    [VoucherStatus.PENDING_REVIEW]: "Pending Review",
    [VoucherStatus.APPROVED]: "Approved",
    [VoucherStatus.REJECTED]: "Rejected",
    [VoucherStatus.INFORMATION_REQUEST]: "Info Requested",
    [VoucherStatus.BANK_UPLOAD]: "Bank Upload",
    [VoucherStatus.PAID]: "Paid",
  };
  return labels[status] || status;
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<PaymentVoucher | null>(
    null,
  );
  const [actioningId, setActioningId] = useState<number | null>(null);
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  const apiBaseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(
    /\/api\/?$/,
    "",
  );

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
    isSuperAdmin || isFinanceManager || hasPermission(PERMISSIONS.CREATE, "write");
  const canReview =
    isSuperAdmin || isFinanceExecutive || hasPermission(PERMISSIONS.REVIEW, "write");
  const canResubmit =
    isSuperAdmin || isFinanceManager || hasPermission(PERMISSIONS.RESUBMIT, "write");
  const canBankUpload =
    isSuperAdmin || isFinanceManager || hasPermission(PERMISSIONS.BANK_UPLOAD, "write");
  const canMarkPaid =
    isSuperAdmin || hasPermission(PERMISSIONS.MARK_PAID, "write");
  const canAccess =
    isSuperAdmin ||
    isFinanceManager ||
    isFinanceExecutive ||
    permissionActionKeys.some((key) => hasPermission(key, "read"));

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

  useEffect(() => {
    if (statusParam) {
      setFilterStatus(statusParam as VoucherStatus);
    } else {
      setFilterStatus("");
    }
  }, [statusParam]);

  useEffect(() => {
    if (!permissionLoading && canAccess) fetchVouchers();
  }, [canAccess, filterStatus, permissionLoading]);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      setError("");
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      const qs = params.toString();
      const endpoint = qs ? `/vouchers?${qs}` : "/vouchers";
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

  const handleResubmit = async (id: number) => {
    setActioningId(id);
    setError("");
    try {
      await api.put(`/vouchers/${id}/resubmissions`);
      setSuccess("Voucher resubmitted for review.");
      fetchVouchers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to resubmit");
    } finally {
      setActioningId(null);
    }
  };

  const handleBankUpload = async (id: number) => {
    setActioningId(id);
    setError("");
    try {
      await api.put(`/vouchers/${id}/bank-uploads`);
      setSuccess("Marked as Bank Upload.");
      fetchVouchers();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to mark bank upload");
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
                    <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Invoice</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Created By</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Comment</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-[var(--card-bg)] divide-y divide-[var(--gray-100)]">
                  {vouchers.map((v) => (
                    <tr key={v.id} className="hover:bg-[var(--gray-25)] transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[var(--foreground)]">
                        {v.voucher_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[var(--gray-600)]">
                        {(v as any).sp_company_name ||
                          `${(v as any).sp_first_name || ""} ${(v as any).sp_last_name || ""}`.trim() ||
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
                        {(v as any).invoice_url ? (
                          <a
                            href={`${apiBaseUrl}${(v as any).invoice_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>View</span>
                          </a>
                        ) : (
                          <span className="text-xs text-[var(--gray-300)]">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(v.status)}`}>
                          {getStatusLabel(v.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-[var(--gray-500)]">
                        {(v as any).created_by_first_name}{" "}
                        {(v as any).created_by_last_name}
                      </td>
                      <td className="px-6 py-4 text-xs text-[var(--gray-400)] max-w-[150px] truncate">
                        {v.executive_comment ? (
                          <span
                            className="inline-flex items-center gap-1"
                            title={v.executive_comment}
                          >
                            <MessageSquare className="h-3.5 w-3.5 shrink-0 text-[var(--gray-300)]" />
                            <span className="truncate">{v.executive_comment}</span>
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          {canReview && v.status === VoucherStatus.PENDING_REVIEW && (
                            <button
                              onClick={() => {
                                setSelectedVoucher(v);
                                setShowReviewModal(true);
                              }}
                              className="text-xs font-bold text-[var(--primary)] hover:underline cursor-pointer"
                            >
                              Review
                            </button>
                          )}
                          {canResubmit && v.status === VoucherStatus.INFORMATION_REQUEST && (
                            <button
                              onClick={() => handleResubmit(v.id)}
                              disabled={actioningId === v.id}
                              className="text-xs font-bold text-[var(--primary)] hover:underline disabled:opacity-50 cursor-pointer"
                            >
                              {actioningId === v.id ? "Resubmitting..." : "Resubmit"}
                            </button>
                          )}
                          {canBankUpload && v.status === VoucherStatus.APPROVED && (
                            <button
                              onClick={() => handleBankUpload(v.id)}
                              disabled={actioningId === v.id}
                              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Upload className="h-3.5 w-3.5" />
                              <span>{actioningId === v.id ? "..." : "Bank Upload"}</span>
                            </button>
                          )}
                          {canMarkPaid && v.status === VoucherStatus.BANK_UPLOAD && (
                            <button
                              onClick={() => handleMarkPaid(v.id)}
                              disabled={actioningId === v.id}
                              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <DollarSign className="h-3.5 w-3.5" />
                              <span>{actioningId === v.id ? "..." : "Mark Paid"}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Mobile View: Wallet Tickets Layout */}
        <div className="lg:hidden flex flex-col gap-5">
          {vouchers.map((v) => {
            const hasActions = 
              (canReview && v.status === VoucherStatus.PENDING_REVIEW) ||
              (canResubmit && v.status === VoucherStatus.INFORMATION_REQUEST) ||
              (canBankUpload && v.status === VoucherStatus.APPROVED) ||
              (canMarkPaid && v.status === VoucherStatus.BANK_UPLOAD);

            return (
              <div
                key={v.id}
                className="relative bg-[var(--card-bg)] border border-[var(--gray-100)] rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Visual Side Notches to Look Like Ticket */}
                <div className="absolute top-[4.5rem] -left-2.5 w-5 h-5 rounded-full bg-[var(--background)] border-r border-[var(--gray-100)] z-10 pointer-events-none" />
                <div className="absolute top-[4.5rem] -right-2.5 w-5 h-5 rounded-full bg-[var(--background)] border-l border-[var(--gray-100)] z-10 pointer-events-none" />

                {/* Ticket Top Part: ID & Status */}
                <div className="p-5 pb-4.5 flex justify-between items-center bg-[var(--gray-25)] border-b border-dashed border-[var(--gray-100)]">
                  <div>
                    <span className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider block">Voucher Number</span>
                    <span className="text-sm font-extrabold text-[var(--foreground)]">{v.voucher_number}</span>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${getStatusStyle(v.status)}`}>
                    {getStatusLabel(v.status)}
                  </span>
                </div>

                {/* Ticket Bottom Part: Key Info */}
                <div className="p-5 flex flex-col gap-4">
                  {/* Grid details */}
                  <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-xs">
                    <div>
                      <p className="text-[10px] font-semibold text-[var(--gray-400)] mb-0.5">Service Provider</p>
                      <p className="font-bold text-[var(--foreground)] truncate">
                        {(v as any).sp_company_name ||
                          `${(v as any).sp_first_name || ""} ${(v as any).sp_last_name || ""}`.trim() ||
                          "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-[var(--gray-400)] mb-0.5">Amount (VAT Inc.)</p>
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
                        <span>
                          {(v as any).created_by_first_name} {(v as any).created_by_last_name}
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-[var(--gray-400)] mb-0.5">Invoice File</p>
                      {(v as any).invoice_url ? (
                        <a
                          href={`${apiBaseUrl}${(v as any).invoice_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-[var(--primary)] hover:underline"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>View Invoice</span>
                        </a>
                      ) : (
                        <span className="text-[var(--gray-300)] font-semibold">-</span>
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

                  {/* Executive comments */}
                  {v.executive_comment && (
                    <div className="p-3 bg-[var(--info-light)] text-[var(--info-text)] rounded-xl text-xs border border-[var(--info-text)]/5 flex gap-2">
                      <MessageSquare className="h-4 w-4 shrink-0 text-[var(--info-text)] mt-0.5" />
                      <div>
                        <p className="text-[9px] font-bold text-[var(--info-text)] uppercase tracking-wider mb-0.5">Executive Comment</p>
                        <p className="font-semibold leading-relaxed">{v.executive_comment}</p>
                      </div>
                    </div>
                  )}

                  {/* Action Bar */}
                  {hasActions && (
                    <div className="pt-3.5 border-t border-[var(--gray-50)] flex gap-2">
                      {canReview && v.status === VoucherStatus.PENDING_REVIEW && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full text-xs py-2 bg-[var(--primary)] cursor-pointer"
                          onClick={() => {
                            setSelectedVoucher(v);
                            setShowReviewModal(true);
                          }}
                        >
                          Review Voucher
                        </Button>
                      )}
                      {canResubmit && v.status === VoucherStatus.INFORMATION_REQUEST && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full text-xs py-2 bg-[var(--primary)] cursor-pointer"
                          onClick={() => handleResubmit(v.id)}
                          isLoading={actioningId === v.id}
                        >
                          Resubmit Voucher
                        </Button>
                      )}
                      {canBankUpload && v.status === VoucherStatus.APPROVED && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full text-xs py-2 bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                          leftIcon={<Upload className="h-3.5 w-3.5" />}
                          onClick={() => handleBankUpload(v.id)}
                          isLoading={actioningId === v.id}
                        >
                          Mark Bank Upload
                        </Button>
                      )}
                      {canMarkPaid && v.status === VoucherStatus.BANK_UPLOAD && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="w-full text-xs py-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                          leftIcon={<DollarSign className="h-3.5 w-3.5" />}
                          onClick={() => handleMarkPaid(v.id)}
                          isLoading={actioningId === v.id}
                        >
                          Mark Paid
                        </Button>
                      )}
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
          <h1 className="text-2xl lg:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">Vouchers</h1>
          <p className="text-sm text-[var(--gray-400)] font-medium mt-1">
            Payment vouchers: create, review, bank upload, and mark paid.
          </p>
        </div>
        {canCreate && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-sm flex items-center justify-center self-start sm:self-center cursor-pointer"
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Create Voucher
          </Button>
        )}
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
      <div className="flex flex-wrap gap-4 items-center bg-[var(--card-bg)] border border-[var(--gray-100)] p-4 rounded-2xl shadow-sm">
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
            className="block w-full sm:min-w-[200px] px-3 py-2 border border-[var(--gray-100)] rounded-xl text-xs font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
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
