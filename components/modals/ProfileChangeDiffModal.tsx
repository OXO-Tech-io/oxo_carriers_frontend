'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type {
  AddressValue,
  BankAccountValue,
  DependentValue,
  EmergencyContactRecordValue,
  NomineeValue,
  ProfileChangeItem,
  ProfileChangeRequest,
  QualificationLevel,
} from '@/types/profile';
import { QUALIFICATION_LEVEL_OPTIONS } from '@/types/profile';
import { format } from 'date-fns';

const FIELD_LABELS: Record<string, string> = {
  contactNumber: 'Telephone Number',
  undergraduateDegreeCompletionDate: 'Undergraduate Degree Completion Date',
  bank_account: 'Bank Account',
  title: 'Title',
  address: 'Permanent Address',
  residing_address: 'Residing Address',
  blood_type: 'Blood Type',
  full_name_as_nic: 'Full Name as in NIC',
  name_with_initials: 'Name with Initials',
  date_of_birth: 'Date of Birth',
  birth_place: 'Birth Place',
  sex: 'Sex',
  marital_status: 'Marital Status',
  nationality: 'Nationality',
  spouse_name: 'Spouse Name',
  mother_name: 'Mother Name',
  father_name: 'Father Name',
  landline_number: 'Landline Number',
  national_id: 'National Identity Card Number',
  anniversary_date: 'Wedding Anniversary Date',
  hobbies: 'Hobbies',
  community_activities: 'Community Activities',
  professional_memberships: 'Professional Memberships',
};

const STATUS_STYLES: Record<ProfileChangeRequest['status'], { label: string; className: string }> = {
  pending_approval: { label: 'Pending Approval', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700 border-red-200' },
  returned_for_modification: { label: 'Returned', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  cancelled: { label: 'Cancelled', className: 'bg-[var(--gray-50)] text-[var(--gray-500)] border-[var(--gray-200)]' },
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  try {
    return format(new Date(value), 'MMM dd, yyyy');
  } catch {
    return value;
  }
}

function qualificationLabel(level?: QualificationLevel) {
  return QUALIFICATION_LEVEL_OPTIONS.find((o) => o.value === level)?.label ?? level ?? '—';
}

function BankAccountBlock({ value }: { value: BankAccountValue }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
      <dt className="text-[10px] font-bold text-[var(--gray-400)] uppercase">Bank</dt>
      <dd className="text-xs font-semibold text-[var(--foreground)]">{value.bankName || '—'}</dd>
      <dt className="text-[10px] font-bold text-[var(--gray-400)] uppercase">Holder</dt>
      <dd className="text-xs font-semibold text-[var(--foreground)]">{value.accountHolderName || '—'}</dd>
      <dt className="text-[10px] font-bold text-[var(--gray-400)] uppercase">Account #</dt>
      <dd className="text-xs font-semibold text-[var(--foreground)]">{value.accountNumber || '—'}</dd>
      <dt className="text-[10px] font-bold text-[var(--gray-400)] uppercase">Branch</dt>
      <dd className="text-xs font-semibold text-[var(--foreground)]">{value.bankBranch || '—'}</dd>
    </dl>
  );
}

function AddressBlock({ value }: { value: AddressValue }) {
  return (
    <div className="space-y-0.5">
      <p>{value.addressLine1}</p>
      {value.addressLine2 && <p>{value.addressLine2}</p>}
      <p>{value.city}, {value.district}</p>
    </div>
  );
}

function EmergencyContactRecordBlock({ value }: { value: EmergencyContactRecordValue }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
      <dt className="text-[10px] font-bold text-[var(--gray-400)] uppercase">Name</dt>
      <dd className="text-xs font-semibold text-[var(--foreground)]">{value.name}</dd>
      <dt className="text-[10px] font-bold text-[var(--gray-400)] uppercase">Contact Number</dt>
      <dd className="text-xs font-semibold text-[var(--foreground)]">{value.contactNumber}</dd>
      <dt className="text-[10px] font-bold text-[var(--gray-400)] uppercase">Relationship</dt>
      <dd className="text-xs font-semibold text-[var(--foreground)]">{value.relationship}</dd>
    </dl>
  );
}

function NomineeBlock({ value }: { value: NomineeValue }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
      <dt className="text-[10px] font-bold text-[var(--gray-400)] uppercase">Name</dt>
      <dd className="text-xs font-semibold text-[var(--foreground)]">{value.nameWithInitials}</dd>
      <dt className="text-[10px] font-bold text-[var(--gray-400)] uppercase">NIC</dt>
      <dd className="text-xs font-semibold text-[var(--foreground)]">{value.nic}</dd>
      <dt className="text-[10px] font-bold text-[var(--gray-400)] uppercase">Relationship</dt>
      <dd className="text-xs font-semibold text-[var(--foreground)]">{value.relationship}</dd>
      <dt className="text-[10px] font-bold text-[var(--gray-400)] uppercase">Proportion</dt>
      <dd className="text-xs font-semibold text-[var(--foreground)]">{value.proportionPercent}%</dd>
    </dl>
  );
}

function DependentBlock({ value }: { value: DependentValue }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5">
      <dt className="text-[10px] font-bold text-[var(--gray-400)] uppercase">Name</dt>
      <dd className="text-xs font-semibold text-[var(--foreground)]">{value.fullName}</dd>
      <dt className="text-[10px] font-bold text-[var(--gray-400)] uppercase">NIC</dt>
      <dd className="text-xs font-semibold text-[var(--foreground)]">{value.nic || '—'}</dd>
      <dt className="text-[10px] font-bold text-[var(--gray-400)] uppercase">Date of Birth</dt>
      <dd className="text-xs font-semibold text-[var(--foreground)]">{formatDate(value.dateOfBirth)}</dd>
      <dt className="text-[10px] font-bold text-[var(--gray-400)] uppercase">Relationship</dt>
      <dd className="text-xs font-semibold text-[var(--foreground)] capitalize">{value.relationship}</dd>
    </dl>
  );
}

function ChangeItemCard({ item }: { item: ProfileChangeItem }) {
  let label: string;
  let beforeNode: React.ReactNode;
  let afterNode: React.ReactNode;

  if (item.entityType === 'user_field' && item.field === 'bank_account') {
    label = FIELD_LABELS.bank_account;
    beforeNode = <BankAccountBlock value={item.before} />;
    afterNode = <BankAccountBlock value={item.after} />;
  } else if (item.entityType === 'user_field') {
    label = FIELD_LABELS[item.field] ?? item.field;
    beforeNode = <span>{item.field === 'undergraduateDegreeCompletionDate' ? formatDate(item.before) : item.before || '—'}</span>;
    afterNode = <span>{item.field === 'undergraduateDegreeCompletionDate' ? formatDate(item.after) : item.after || '—'}</span>;
  } else if (item.entityType === 'employee_pii_field') {
    label = FIELD_LABELS[item.field] ?? item.field;
    if (item.field === 'address' || item.field === 'residing_address') {
      beforeNode = item.before ? <AddressBlock value={item.before} /> : <span className="text-[var(--gray-400)]">—</span>;
      afterNode = item.after ? <AddressBlock value={item.after} /> : <span className="text-[var(--gray-400)]">—</span>;
    } else {
      beforeNode = <span>{item.before || '—'}</span>;
      afterNode = <span>{item.after || '—'}</span>;
    }
  } else if (item.entityType === 'welfare_field') {
    label = FIELD_LABELS[item.field] ?? item.field;
    beforeNode = <span>{item.field === 'anniversary_date' ? formatDate(item.before) : item.before || '—'}</span>;
    afterNode = <span>{item.field === 'anniversary_date' ? formatDate(item.after) : item.after || '—'}</span>;
  } else if (item.entityType === 'nominee') {
    label = `Nominee (${item.operation})`;
    const renderRecord = (rec?: NomineeValue | null) =>
      rec ? <NomineeBlock value={rec} /> : <span className="text-[var(--gray-400)]">—</span>;
    beforeNode = renderRecord(item.before);
    afterNode = renderRecord(item.after);
  } else if (item.entityType === 'dependent') {
    label = `Dependent (${item.operation})`;
    const renderRecord = (rec?: DependentValue | null) =>
      rec ? <DependentBlock value={rec} /> : <span className="text-[var(--gray-400)]">—</span>;
    beforeNode = renderRecord(item.before);
    afterNode = renderRecord(item.after);
  } else if (item.entityType === 'emergency_contact_record') {
    label = `Emergency Contact (${item.operation})`;
    const renderRecord = (rec?: EmergencyContactRecordValue | null) =>
      rec ? <EmergencyContactRecordBlock value={rec} /> : <span className="text-[var(--gray-400)]">—</span>;
    beforeNode = renderRecord(item.before);
    afterNode = renderRecord(item.after);
  } else if (item.entityType === 'education') {
    label = `Education (${item.operation})`;
    const renderRecord = (rec?: typeof item.after) =>
      rec ? (
        <div className="space-y-1">
          <p className="font-semibold">{rec.qualificationTitle}</p>
          <p>{qualificationLabel(rec.qualificationLevel)} · {rec.awardingInstitution}</p>
          <p className="text-[var(--gray-400)]">{rec.isOngoing ? 'Currently pursuing' : formatDate(rec.dateAwarded)}</p>
        </div>
      ) : (
        <span className="text-[var(--gray-400)]">—</span>
      );
    beforeNode = renderRecord(item.before ?? undefined);
    afterNode = renderRecord(item.after ?? undefined);
  } else {
    label = `Work History (${item.operation})`;
    const renderRecord = (rec?: typeof item.after) =>
      rec ? (
        <div className="space-y-1">
          <p className="font-semibold">
            {rec.positionHeld}
            {rec.employmentType !== 'regular' && (
              <span className="ml-1.5 text-[9px] font-bold uppercase tracking-wider text-[var(--primary)]">
                ({rec.employmentType})
              </span>
            )}
          </p>
          <p>{rec.organization}</p>
          <p className="text-[var(--gray-400)]">
            {formatDate(rec.startDate)} – {rec.endDate ? formatDate(rec.endDate) : 'Present'}
          </p>
        </div>
      ) : (
        <span className="text-[var(--gray-400)]">—</span>
      );
    beforeNode = renderRecord(item.before ?? undefined);
    afterNode = renderRecord(item.after ?? undefined);
  }

  const isCreate = 'operation' in item && item.operation === 'create';

  return (
    <div className="rounded-2xl border border-[var(--gray-100)] overflow-hidden">
      <div className="px-4 py-2.5 bg-[var(--gray-25)] border-b border-[var(--gray-100)]">
        <p className="text-xs font-bold text-[var(--foreground)]">{label}</p>
      </div>
      <div className="grid grid-cols-2 divide-x divide-[var(--gray-100)]">
        {!isCreate && (
          <div className="p-4 bg-red-50/40">
            <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2">Before</p>
            <div className="text-xs text-[var(--foreground)]">{beforeNode}</div>
          </div>
        )}
        <div className={`p-4 bg-emerald-50/40 ${isCreate ? 'col-span-2' : ''}`}>
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-2">
            {isCreate ? 'New Record' : 'After'}
          </p>
          <div className="text-xs text-[var(--foreground)]">{afterNode}</div>
        </div>
      </div>
    </div>
  );
}

interface ProfileChangeDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ProfileChangeRequest | null;
  employeeName?: string;
  canDecide: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onReturn?: () => void;
  isDeciding?: boolean;
}

export default function ProfileChangeDiffModal({
  isOpen,
  onClose,
  request,
  employeeName,
  canDecide,
  onApprove,
  onReject,
  onReturn,
  isDeciding = false,
}: ProfileChangeDiffModalProps) {
  if (!request) return null;

  const statusStyle = STATUS_STYLES[request.status];
  const showActions = canDecide && request.status === 'pending_approval';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Profile Change Request"
      size="lg"
      footer={
        showActions ? (
          <>
            <Button variant="outline" onClick={onReturn} disabled={isDeciding}>
              Return for Modification
            </Button>
            <Button variant="danger" onClick={onReject} disabled={isDeciding}>
              Reject
            </Button>
            <Button onClick={onApprove} isLoading={isDeciding}>
              Approve
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            {employeeName && <p className="text-sm font-bold text-[var(--foreground)]">{employeeName}</p>}
            <p className="text-xs text-[var(--gray-400)] font-medium mt-0.5">
              Submitted {formatDate(request.createdAt)}
              {request.comments ? ` · "${request.comments}"` : ''}
            </p>
          </div>
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusStyle.className}`}
          >
            {statusStyle.label}
          </span>
        </div>

        <div className="space-y-3">
          {request.changes.map((item, idx) => (
            <ChangeItemCard key={idx} item={item} />
          ))}
        </div>

        {request.status !== 'pending_approval' && request.reviewerComments && (
          <div className="rounded-2xl border border-[var(--gray-100)] bg-[var(--gray-25)] p-4">
            <p className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-1">
              Reviewer Comments
            </p>
            <p className="text-xs text-[var(--foreground)]">{request.reviewerComments}</p>
            {request.decidedAt && (
              <p className="text-[10px] text-[var(--gray-400)] mt-2">Decided {formatDate(request.decidedAt)}</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
