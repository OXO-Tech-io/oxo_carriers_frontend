'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { useToast } from '@/contexts/ToastContext';
import { useAllChangeRequestsQuery } from '@/hooks/queries/use-all-change-requests-query';
import { useApproveProfileChangeMutation } from '@/hooks/mutations/use-approve-profile-change-mutation';
import { useRejectProfileChangeMutation } from '@/hooks/mutations/use-reject-profile-change-mutation';
import { useReturnProfileChangeMutation } from '@/hooks/mutations/use-return-profile-change-mutation';
import ProfileChangeDiffModal from '@/components/modals/ProfileChangeDiffModal';
import ProfileChangeDecisionModal from '@/components/modals/ProfileChangeDecisionModal';
import type { ProfileChangeRequest, ProfileChangeRequestStatus } from '@/types/profile';

const STATUS_BADGES: Record<ProfileChangeRequestStatus, { label: string; className: string }> = {
  pending_approval: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700 border-red-200' },
  returned_for_modification: { label: 'Returned', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  cancelled: { label: 'Cancelled', className: 'bg-[var(--gray-50)] text-[var(--gray-500)] border-[var(--gray-200)]' },
};

const FILTERS: { key: ProfileChangeRequestStatus | 'all'; label: string }[] = [
  { key: 'pending_approval', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'returned_for_modification', label: 'Returned' },
  { key: 'all', label: 'All' },
];

const USER_FIELD_LABELS: Record<string, string> = {
  bank_account: 'Bank Account',
  contactNumber: 'Telephone Number',
  undergraduateDegreeCompletionDate: 'Undergraduate Degree Date',
  title: 'Title',
};

const PII_FIELD_LABELS: Record<string, string> = {
  address: 'Address',
  emergency_contact: 'Emergency Contact',
  blood_type: 'Blood Type',
};

function changeSummary(request: ProfileChangeRequest): string {
  const first = request.changes[0];
  const label =
    first.entityType === 'user_field'
      ? USER_FIELD_LABELS[first.field] ?? first.field
      : first.entityType === 'employee_pii_field'
      ? PII_FIELD_LABELS[first.field] ?? first.field
      : first.entityType === 'education'
      ? `Education (${first.operation})`
      : `Work History (${first.operation})`;
  return request.changes.length > 1 ? `${label} +${request.changes.length - 1} more` : label;
}

export default function ProfileApprovalsPage() {
  const { isHR, isSuperAdmin } = useAuth();
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState<ProfileChangeRequestStatus | 'all'>('pending_approval');
  const [selected, setSelected] = useState<ProfileChangeRequest | null>(null);
  const [decisionModal, setDecisionModal] = useState<'rejected' | 'returned_for_modification' | null>(null);
  const [approveConfirmOpen, setApproveConfirmOpen] = useState(false);

  const { data: requests = [], isLoading } = useAllChangeRequestsQuery(
    statusFilter === 'all' ? {} : { status: statusFilter }
  );
  const approveMutation = useApproveProfileChangeMutation();
  const rejectMutation = useRejectProfileChangeMutation();
  const returnMutation = useReturnProfileChangeMutation();

  if (!isHR && !isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <p className="text-lg font-semibold text-[var(--foreground)]">Access Denied</p>
          <p className="text-[var(--gray-400)] text-sm mt-1">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const handleApprove = async () => {
    if (!selected) return;
    try {
      await approveMutation.mutateAsync({ id: selected.id });
      toast.success('Request approved', "The employee's profile has been updated.");
      setApproveConfirmOpen(false);
      setSelected(null);
    } catch {
      toast.error('Failed to approve request', 'Please try again.');
    }
  };

  const handleDecisionConfirm = async (reviewerComments: string) => {
    if (!selected || !decisionModal) return;
    try {
      if (decisionModal === 'rejected') {
        await rejectMutation.mutateAsync({ id: selected.id, reviewerComments });
        toast.success('Request rejected', 'The employee has been notified.');
      } else {
        await returnMutation.mutateAsync({ id: selected.id, reviewerComments });
        toast.success('Request returned', 'The employee can resubmit after making changes.');
      }
      setDecisionModal(null);
      setSelected(null);
    } catch {
      toast.error('Failed to submit decision', 'Please try again.');
    }
  };

  const columns: ColumnDef<ProfileChangeRequest, any>[] = [
    {
      header: 'Employee',
      accessorFn: (row) => row.employee?.firstName ?? '',
      cell: ({ row }) => {
        const emp = row.original.employee;
        return (
          <div>
            <p className="font-bold text-[var(--foreground)]">
              {emp ? `${emp.firstName} ${emp.lastName}` : `User #${row.original.userId}`}
            </p>
            {emp?.employeeId && <p className="text-[10px] text-[var(--gray-400)]">{emp.employeeId}</p>}
          </div>
        );
      },
    },
    {
      header: 'Change Summary',
      accessorFn: (row) => changeSummary(row),
      cell: ({ row }) => <span className="font-semibold">{changeSummary(row.original)}</span>,
    },
    {
      header: 'Submitted Date',
      accessorKey: 'createdAt',
      cell: ({ getValue }) => {
        const v = getValue<string>();
        try {
          return format(new Date(v), 'MMM dd, yyyy');
        } catch {
          return v;
        }
      },
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: ({ getValue }) => {
        const status = getValue<ProfileChangeRequestStatus>();
        const badge = STATUS_BADGES[status];
        return (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badge.className}`}
          >
            {badge.label}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      <div>
        <h1 className="text-2xl lg:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">Profile Approvals</h1>
        <p className="text-sm text-[var(--gray-400)] font-medium mt-1">
          Review and decide on employee profile change requests.
        </p>
      </div>

      <Card className="shadow-sm border-[var(--gray-100)] p-6">
        <div className="flex flex-wrap gap-1 bg-[var(--gray-25)] border border-[var(--gray-100)] p-1.5 rounded-2xl mb-6 w-fit">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                statusFilter === f.key
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'text-[var(--gray-400)] hover:text-[var(--foreground)] hover:bg-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <DataTable
          columns={columns}
          data={requests}
          isLoading={isLoading}
          onRowClick={(row) => setSelected(row)}
          emptyTitle="No requests found"
          emptyDescription="There are no profile change requests matching this filter."
        />
      </Card>

      <ProfileChangeDiffModal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        request={selected}
        employeeName={selected?.employee ? `${selected.employee.firstName} ${selected.employee.lastName}` : undefined}
        canDecide
        onApprove={() => setApproveConfirmOpen(true)}
        onReject={() => setDecisionModal('rejected')}
        onReturn={() => setDecisionModal('returned_for_modification')}
        isDeciding={approveMutation.isPending}
      />

      <ConfirmationDialog
        isOpen={approveConfirmOpen}
        onClose={() => setApproveConfirmOpen(false)}
        onConfirm={handleApprove}
        title="Approve Change Request"
        message="This will immediately apply all the requested changes to the employee's profile."
        confirmLabel="Approve"
        isLoading={approveMutation.isPending}
      />

      {decisionModal && (
        <ProfileChangeDecisionModal
          isOpen
          onClose={() => setDecisionModal(null)}
          decision={decisionModal}
          onConfirm={handleDecisionConfirm}
          isLoading={rejectMutation.isPending || returnMutation.isPending}
        />
      )}
    </div>
  );
}
