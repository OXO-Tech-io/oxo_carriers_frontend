'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLeaveRequestsQuery } from '@/hooks/queries/use-leave-requests-query';
import { useApproveLeaveMutation } from '@/hooks/mutations/use-approve-leave-mutation';
import { useRejectLeaveMutation } from '@/hooks/mutations/use-reject-leave-mutation';
import { CheckCircle2, User, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { Card, EmptyState } from '@/components/ui';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { RejectLeaveModal } from '@/components/leaves/RejectLeaveModal';
import { LeaveStatusBadge } from '@/components/leaves/LeaveStatusBadge';
import type { LeaveRequest } from '@/types';
import { DATE_FORMATS } from '@/lib/constants';

type Tab = 'pending' | 'approved' | 'rejected';

const TAB_STATUS: Record<Tab, string> = {
  pending: 'pending',
  approved: 'hr_approved',
  rejected: 'rejected',
};

const TAB_LABEL: Record<Tab, string> = {
  pending: 'Pending Approvals',
  approved: 'Approved Requests',
  rejected: 'Rejected Requests',
};

// Administrative view of every employee's leave requests, separated from the
// personal "Leaves" page (OCD-510). Restricted to Administrator and HR
// Manager (OCD-504) - HR Executive and every other role are hidden from this
// page by the sidebar and self-scoped by the backend even if they browse here
// directly.
export default function AdminLeaveManagementPage() {
  const { isSuperAdmin, isHRManager } = useAuth();
  const canAccess = isSuperAdmin || isHRManager;
  const [activeTab, setActiveTab] = useState<Tab>('pending');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [approveTarget, setApproveTarget] = useState<LeaveRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<LeaveRequest | null>(null);

  const leaveRequestsQuery = useLeaveRequestsQuery(
    { status: TAB_STATUS[activeTab] },
    { enabled: canAccess }
  );
  const requests = leaveRequestsQuery.data ?? [];
  // Falls back to the first request whenever the selected one isn't in the
  // current list - e.g. right after switching tabs, or after an approve/
  // reject mutation refetches and the acted-on request drops off the list.
  const selected = requests.find((r) => r.id === selectedId) ?? requests[0] ?? null;

  const approveLeaveMutation = useApproveLeaveMutation();
  const rejectLeaveMutation = useRejectLeaveMutation();

  const changeTab = (tab: Tab) => {
    setActiveTab(tab);
    setSelectedId(null);
  };

  const handleConfirmApprove = async () => {
    if (!approveTarget) return;
    setError('');
    try {
      await approveLeaveMutation.mutateAsync({
        id: approveTarget.id,
        input: { approvedBy: 'hr' },
      });
      setSuccess('Leave request approved successfully');
      setApproveTarget(null);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to approve leave request';
      setError(message);
    }
  };

  const handleConfirmReject = async (reason: string) => {
    if (!rejectTarget) return;
    setError('');
    try {
      await rejectLeaveMutation.mutateAsync({
        id: rejectTarget.id,
        input: { rejectionReason: reason },
      });
      setSuccess('Leave request rejected');
      setRejectTarget(null);
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to reject leave request';
      setError(message);
    }
  };

  if (!canAccess) {
    return (
      <div className="p-6">
        <div className="rounded-xl bg-red-500/10 border-l-4 border-red-500 p-4 text-sm font-semibold text-red-600 dark:text-red-400">
          You don&apos;t have permission to access this page.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">Leave Management</h1>
        <p className="text-sm text-[var(--gray-400)] font-medium mt-1">
          Review and action leave requests across the organization.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border-l-4 border-red-500 text-red-600 dark:text-red-400 p-4 rounded-xl text-xs font-semibold animate-fade-in">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border-l-4 border-emerald-500 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl text-xs font-semibold animate-fade-in">
          {success}
        </div>
      )}

      <div className="border-b border-[var(--gray-100)]">
        <nav className="-mb-px flex gap-6 overflow-x-auto">
          {(['pending', 'approved', 'rejected'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => changeTab(tab)}
              className={`py-3 px-1 border-b-2 font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--gray-400)] hover:text-[var(--foreground)]'
              }`}
            >
              {TAB_LABEL[tab]}
            </button>
          ))}
        </nav>
      </div>

      {leaveRequestsQuery.isLoading ? (
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--primary)] border-t-transparent" />
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={activeTab === 'pending' ? 'No pending approvals left' : `No ${activeTab} requests`}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
          {/* Compact, scannable list instead of one full card per request - click a
              row to review and act on it in the detail panel alongside. */}
          <div
            data-testid="leave-request-list"
            className="space-y-1.5 rounded-2xl border border-[var(--gray-100)] bg-[var(--card-bg)] p-2 lg:max-h-[calc(100vh-22rem)] lg:overflow-y-auto"
          >
            {requests.map((request) => {
              const isSelected = selected?.id === request.id;
              return (
                <button
                  key={request.id}
                  onClick={() => setSelectedId(request.id)}
                  className={`w-full flex items-start gap-3 text-left p-3 rounded-xl transition-colors cursor-pointer ${
                    isSelected ? 'bg-[var(--primary-light)]' : 'hover:bg-[var(--gray-25)]'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg shrink-0 ${
                      isSelected ? 'bg-[var(--primary)] text-white' : 'bg-[var(--primary-light)] text-[var(--primary)]'
                    }`}
                  >
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[var(--foreground)] truncate">
                      {request.user?.first_name} {request.user?.last_name}
                    </p>
                    <p className="text-[11px] text-[var(--gray-400)] font-semibold truncate mt-0.5">
                      {request.leave_type?.name} · {format(new Date(request.start_date), DATE_FORMATS.SHORT)}–
                      {format(new Date(request.end_date), DATE_FORMATS.SHORT)} · {request.total_days}d
                    </p>
                  </div>
                  <LeaveStatusBadge status={request.status} />
                </button>
              );
            })}
          </div>

          <div data-testid="leave-request-detail">
            {selected && (
              <Card className="relative">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] shrink-0">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[var(--foreground)]">
                          {selected.user?.first_name} {selected.user?.last_name}
                        </h3>
                        <p className="text-xs text-[var(--gray-400)] mt-0.5 font-medium">{selected.user?.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-3.5 bg-[var(--gray-25)] border border-[var(--gray-100)] rounded-xl">
                      <div>
                        <p className="text-[10px] text-[var(--gray-400)] font-bold uppercase tracking-wider mb-0.5">Leave Type</p>
                        <p className="text-xs font-bold text-[var(--foreground)]">{selected.leave_type?.name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[var(--gray-400)] font-bold uppercase tracking-wider mb-0.5">Dates</p>
                        <p className="text-xs font-bold text-[var(--foreground)]">
                          {format(new Date(selected.start_date), DATE_FORMATS.SHORT)} - {format(new Date(selected.end_date), DATE_FORMATS.MEDIUM)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[var(--gray-400)] font-bold uppercase tracking-wider mb-0.5">Requested Days</p>
                        <p className="text-xs font-extrabold text-[var(--primary)]">{selected.total_days} days</p>
                      </div>
                      {selected.coverup_employee && (
                        <div>
                          <p className="text-[10px] text-[var(--gray-400)] font-bold uppercase tracking-wider mb-0.5">Coverup Employee</p>
                          <p className="text-xs font-bold text-[var(--foreground)]">
                            {selected.coverup_employee.first_name} {selected.coverup_employee.last_name}
                          </p>
                        </div>
                      )}
                    </div>

                    {selected.reason && (
                      <div className="text-xs">
                        <span className="font-bold text-[var(--gray-400)] uppercase tracking-wider block mb-1">Reason</span>
                        <p className="text-[var(--gray-500)] bg-[var(--gray-25)] p-3 rounded-xl border border-[var(--gray-100)] leading-relaxed">
                          {selected.reason}
                        </p>
                      </div>
                    )}

                    {activeTab === 'rejected' && selected.rejection_reason && (
                      <div className="text-xs">
                        <span className="font-bold text-[var(--error-text)] uppercase tracking-wider block mb-1">Rejection Reason</span>
                        <p className="text-[var(--error-text)] bg-[var(--error-light)] p-3 rounded-xl leading-relaxed">
                          {selected.rejection_reason}
                        </p>
                      </div>
                    )}

                    {selected.attachment_url && (
                      <div className="pt-2">
                        <a
                          href={selected.attachment_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline"
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                          <span>View Attachment Doc</span>
                        </a>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <LeaveStatusBadge status={selected.status} />
                      {selected.team_leader_approval_date && (
                        <span className="text-[10px] text-[var(--gray-400)] font-semibold">
                          TL Approved: {format(new Date(selected.team_leader_approval_date), DATE_FORMATS.MEDIUM)}
                        </span>
                      )}
                    </div>
                  </div>

                  {activeTab === 'pending' && (
                    <div className="flex md:flex-col gap-2 shrink-0 justify-end">
                      <button
                        onClick={() => setApproveTarget(selected)}
                        className="px-4 py-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors cursor-pointer"
                      >
                        {selected.status === 'team_leader_approved' ? 'Final Approve' : 'Approve'}
                      </button>
                      <button
                        onClick={() => setRejectTarget(selected)}
                        className="px-4 py-2 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      <ConfirmationDialog
        isOpen={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        onConfirm={handleConfirmApprove}
        title="Approve Leave Request"
        message={`Are you sure you want to approve ${approveTarget?.user ? `${approveTarget.user.first_name} ${approveTarget.user.last_name}'s` : 'this'} leave request?`}
        confirmLabel="Approve"
        isLoading={approveLeaveMutation.isPending}
      />

      <RejectLeaveModal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleConfirmReject}
        isLoading={rejectLeaveMutation.isPending}
      />
    </div>
  );
}
