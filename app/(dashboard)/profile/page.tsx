'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Briefcase,
  FileText,
  Settings,
  Mail,
  Phone,
  MapPin,
  Shield,
  Calendar,
  Lock,
  Download,
  Check,
  Bell,
  Camera,
  DollarSign,
  GraduationCap,
  History,
  ClipboardList,
  Plus,
  Pencil,
  Trash2,
  Landmark,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { format } from 'date-fns';
import { useProfileQuery } from '@/hooks/queries/use-profile-query';
import { useEmployeeEducationQuery } from '@/hooks/queries/use-employee-education-query';
import { useEmployeeWorkHistoryQuery } from '@/hooks/queries/use-employee-work-history-query';
import { useEmployeePersonalDetailsQuery } from '@/hooks/queries/use-employee-personal-details-query';
import { useMyChangeRequestsQuery } from '@/hooks/queries/use-my-change-requests-query';
import { useMyDocumentsQuery } from '@/hooks/queries/use-documents-query';
import { useSubmitProfileChangeMutation } from '@/hooks/mutations/use-submit-profile-change-mutation';
import ProfileChangeRequestModal from '@/components/modals/ProfileChangeRequestModal';
import ContactDetailsChangeModal from '@/components/modals/ContactDetailsChangeModal';
import DegreeDateChangeModal from '@/components/modals/DegreeDateChangeModal';
import EducationChangeModal from '@/components/modals/EducationChangeModal';
import WorkHistoryChangeModal from '@/components/modals/WorkHistoryChangeModal';
import ProfileChangeDiffModal from '@/components/modals/ProfileChangeDiffModal';
import { WorkHistoryTimeline } from '@/components/profile/WorkHistoryTimeline';
import { ExperienceSummaryCard } from '@/components/profile/ExperienceSummaryCard';
import { useToast } from '@/contexts/ToastContext';
import { QUALIFICATION_LEVEL_OPTIONS, TITLE_OPTIONS, type EmployeeEducation, type EmployeeWorkHistory, type ProfileChangeRequest } from '@/types/profile';
import type { ColumnDef } from '@tanstack/react-table';

type ProfileTab = 'personal' | 'contacts' | 'education' | 'work-history' | 'pending-changes' | 'employment' | 'documents' | 'settings';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api(\/v\d+)?\/?$/, '') || 'http://localhost:5000';
const resolveFileUrl = (url: string) => `${API_BASE}${url}`;

const STATUS_BADGES: Record<ProfileChangeRequest['status'], { label: string; className: string }> = {
  pending_approval: { label: 'Pending', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  approved: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700 border-red-200' },
  returned_for_modification: { label: 'Returned', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  cancelled: { label: 'Cancelled', className: 'bg-[var(--gray-50)] text-[var(--gray-500)] border-[var(--gray-200)]' },
};

function qualificationLabel(level: string) {
  return QUALIFICATION_LEVEL_OPTIONS.find((o) => o.value === level)?.label ?? level;
}

function titleLabel(title?: string | null) {
  if (!title) return null;
  return TITLE_OPTIONS.find((o) => o.value === title)?.label ?? title;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');

  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReport: true,
    marketingEmails: false,
  });
  const [settingsMessage, setSettingsMessage] = useState('');

  // Real profile data (replaces the previously hardcoded/fake state)
  const { data: profile } = useProfileQuery();
  const displayUser = profile ?? user;

  const { data: education = [], isLoading: educationLoading } = useEmployeeEducationQuery();
  const { data: workHistory = [], isLoading: workHistoryLoading } = useEmployeeWorkHistoryQuery();
  const { data: pii } = useEmployeePersonalDetailsQuery(displayUser?.id);
  const { data: changeRequests = [], isLoading: changeRequestsLoading } = useMyChangeRequestsQuery();
  const submitChange = useSubmitProfileChangeMutation();
  const documentsQuery = useMyDocumentsQuery();
  // Document Vault shows only documents targeted at this employee individually -
  // company-wide ('all') documents live on the separate Documents page/sidebar item instead.
  const myDocuments = (documentsQuery.data ?? []).filter((doc) => doc.targetType === 'individual');

  const [showChangeRequestModal, setShowChangeRequestModal] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showDegreeDateModal, setShowDegreeDateModal] = useState(false);
  const [educationModal, setEducationModal] = useState<{ open: boolean; record: EmployeeEducation | null }>({
    open: false,
    record: null,
  });
  const [workHistoryModal, setWorkHistoryModal] = useState<{ open: boolean; record: EmployeeWorkHistory | null }>({
    open: false,
    record: null,
  });
  const [deleteConfirm, setDeleteConfirm] = useState<
    | { open: false }
    | { open: true; kind: 'education'; record: EmployeeEducation }
    | { open: true; kind: 'work_history'; record: EmployeeWorkHistory }
  >({ open: false });
  const [selectedRequest, setSelectedRequest] = useState<ProfileChangeRequest | null>(null);

  const getInitials = () => {
    if (!displayUser) return 'OX';
    return `${displayUser.first_name?.[0] || ''}${displayUser.last_name?.[0] || ''}`.toUpperCase() || 'U';
  };

  const formattedHireDate = () => {
    if (!displayUser?.hire_date) return 'N/A';
    try {
      return format(new Date(displayUser.hire_date), 'MMMM dd, yyyy');
    } catch {
      return displayUser.hire_date;
    }
  };

  const formattedDegreeDate = () => {
    if (!displayUser?.undergraduate_degree_completion_date) return 'Not provided';
    try {
      return format(new Date(displayUser.undergraduate_degree_completion_date), 'MMMM dd, yyyy');
    } catch {
      return displayUser.undergraduate_degree_completion_date;
    }
  };

  const handleToggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setSettingsMessage('Preferences updated.');
    setTimeout(() => setSettingsMessage(''), 2500);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.open) return;
    try {
      if (deleteConfirm.kind === 'education') {
        const rec = deleteConfirm.record;
        await submitChange.mutateAsync({
          changes: [
            {
              entityType: 'education',
              operation: 'delete',
              recordId: rec.id,
              before: {
                qualificationLevel: rec.qualificationLevel,
                qualificationTitle: rec.qualificationTitle,
                awardingInstitution: rec.awardingInstitution,
                dateAwarded: rec.dateAwarded,
                isOngoing: rec.isOngoing,
                remarks: rec.remarks,
              },
            },
          ],
        });
      } else {
        const rec = deleteConfirm.record;
        await submitChange.mutateAsync({
          changes: [
            {
              entityType: 'work_history',
              operation: 'delete',
              recordId: rec.id,
              before: {
                organization: rec.organization,
                positionHeld: rec.positionHeld,
                employmentType: rec.employmentType,
                startDate: rec.startDate,
                endDate: rec.endDate,
                remarks: rec.remarks,
              },
            },
          ],
        });
      }
      toast.success('Removal request submitted', 'This record will be removed once HR approves.');
      setDeleteConfirm({ open: false });
    } catch {
      toast.error('Failed to submit request', 'Please try again.');
    }
  };

  const pendingChangeColumns: ColumnDef<ProfileChangeRequest, any>[] = [
    {
      header: 'Change Summary',
      accessorFn: (row) => row.changes.length,
      cell: ({ row }) => {
        const changes = row.original.changes;
        const first = changes[0];
        const PII_LABELS: Record<string, string> = {
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
        };
        const WELFARE_LABELS: Record<string, string> = {
          anniversary_date: 'Wedding Anniversary Date',
          hobbies: 'Hobbies',
          community_activities: 'Community Activities',
          professional_memberships: 'Professional Memberships',
        };
        let label: string;
        if (first.entityType === 'user_field') {
          label = first.field === 'bank_account' ? 'Bank Account' : first.field;
        } else if (first.entityType === 'employee_pii_field') {
          label = PII_LABELS[first.field] ?? first.field;
        } else if (first.entityType === 'welfare_field') {
          label = WELFARE_LABELS[first.field] ?? first.field;
        } else if (first.entityType === 'education') {
          label = 'Education';
        } else if (first.entityType === 'work_history') {
          label = 'Work History';
        } else if (first.entityType === 'nominee') {
          label = 'Nominee';
        } else if (first.entityType === 'dependent') {
          label = 'Dependent';
        } else {
          label = 'Emergency Contact';
        }
        return (
          <span className="font-semibold">
            {label}
            {changes.length > 1 ? ` +${changes.length - 1} more` : ''}
          </span>
        );
      },
    },
    {
      header: 'Submitted',
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
        const status = getValue<ProfileChangeRequest['status']>();
        const badge = STATUS_BADGES[status];
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${badge.className}`}>
            {badge.label}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-8 pb-12 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">Profile Settings</h1>
          <p className="text-sm text-[var(--gray-400)] font-medium mt-1">Manage your personal details, view employment details, and access documents.</p>
        </div>
        <Link href="/profile/wizard">
          <Button>Edit Profile</Button>
        </Link>
      </div>

      <AnimatePresence>
        {settingsMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-[var(--success-light)] border-l-4 border-[var(--success)] text-[var(--success-text)] p-4 rounded-xl text-xs font-semibold flex items-center gap-2"
          >
            <Check className="h-4 w-4 shrink-0" />
            <span>{settingsMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Avatar & Summary Info */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="text-center shadow-[var(--shadow)] border-[var(--gray-100)] overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] opacity-10" />

            <div className="relative pt-6 flex flex-col items-center">
              <div className="relative group">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] text-white text-3xl font-extrabold flex items-center justify-center border-4 border-[var(--card-bg)] shadow-[var(--shadow-md)]">
                  {getInitials()}
                </div>
                <button className="absolute bottom-0 right-0 p-2 rounded-full bg-[var(--primary)] text-white border-2 border-[var(--card-bg)] shadow hover:bg-[var(--primary-hover)] transition-colors cursor-pointer">
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>

              <h2 className="text-lg font-extrabold text-[var(--foreground)] mt-4">
                {displayUser?.first_name} {displayUser?.last_name}
              </h2>
              <p className="text-xs font-bold text-[var(--primary)] uppercase tracking-wider mt-0.5">
                {displayUser?.position || 'Team Member'}
              </p>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--gray-50)] text-[var(--gray-600)] border border-[var(--gray-100)] mt-2">
                ID: {displayUser?.employee_id || 'N/A'}
              </span>
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--gray-50)] text-left space-y-4">
              <div className="flex items-center gap-3 text-xs">
                <Mail className="h-4 w-4 text-[var(--gray-400)] shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider">Email Address</p>
                  <p className="font-semibold text-[var(--foreground)] mt-0.5 truncate">{displayUser?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <Briefcase className="h-4 w-4 text-[var(--gray-400)] shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider">Department</p>
                  <p className="font-semibold text-[var(--foreground)] mt-0.5">{displayUser?.department || 'Operations'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <Shield className="h-4 w-4 text-[var(--gray-400)] shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider">Role Access</p>
                  <p className="font-semibold text-[var(--foreground)] mt-0.5 capitalize">{displayUser?.role?.replace('_', ' ') || 'Employee'}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Tabbed Content Areas */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-[var(--card-bg)] border border-[var(--gray-100)] p-1.5 rounded-2xl shadow-sm flex flex-wrap gap-1">
            {[
              { key: 'personal' as const, label: 'Personal Details', icon: User },
              { key: 'contacts' as const, label: 'Contacts', icon: Phone },
              { key: 'education' as const, label: 'Education', icon: GraduationCap },
              { key: 'work-history' as const, label: 'Work History', icon: History },
              { key: 'pending-changes' as const, label: 'Pending Changes', icon: ClipboardList },
              { key: 'employment' as const, label: 'Employment Info', icon: Briefcase },
              { key: 'documents' as const, label: 'Document Vault', icon: FileText },
              { key: 'settings' as const, label: 'System Settings', icon: Settings },
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === key
                    ? 'bg-[var(--primary)] text-white shadow-sm'
                    : 'text-[var(--gray-400)] hover:text-[var(--foreground)] hover:bg-[var(--gray-25)]'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <div className="min-h-96">
            {activeTab === 'personal' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <Card className="shadow-sm border-[var(--gray-100)] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-base font-bold text-[var(--foreground)]">Contact & Personal details</h3>
                    <Button size="sm" onClick={() => setShowChangeRequestModal(true)}>
                      Request Change
                    </Button>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <ReadOnlyField label="Title" value={titleLabel(displayUser?.title) || 'Not set'} />
                      <div />
                      <ReadOnlyField label="First Name" value={displayUser?.first_name} />
                      <ReadOnlyField label="Last Name" value={displayUser?.last_name} />
                      <div className="sm:col-span-2">
                        <ReadOnlyField label="SSO Email Address" value={displayUser?.email} />
                      </div>
                    </div>

                    <div className="border-t border-[var(--gray-50)] pt-6" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <ReadOnlyField
                        icon={Phone}
                        label="Telephone Number"
                        value={displayUser?.contact_number || 'Not provided'}
                      />
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">
                          Address
                        </label>
                        <div className="flex items-start gap-2 w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl font-semibold text-[var(--gray-500)] bg-[var(--gray-25)] text-sm">
                          <MapPin className="h-3.5 w-3.5 text-[var(--gray-400)] shrink-0 mt-0.5" />
                          {pii?.addressLine1 ? (
                            <div className="space-y-0.5">
                              <p>{pii.addressLine1}</p>
                              {pii.addressLine2 && <p>{pii.addressLine2}</p>}
                              <p>{pii.city}, {pii.district}</p>
                            </div>
                          ) : (
                            <span>Not provided</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="bg-[var(--gray-25)] p-4 rounded-2xl border border-[var(--gray-50)] space-y-4">
                      <p className="text-[10px] font-bold text-[var(--gray-500)] uppercase tracking-wider flex items-center gap-2">
                        <Landmark className="h-3.5 w-3.5" /> Bank Account Details
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ReadOnlyField label="Bank Name" value={displayUser?.bank_name || 'Not provided'} compact />
                        <ReadOnlyField label="Account Holder" value={displayUser?.account_holder_name || 'Not provided'} compact />
                        <ReadOnlyField label="Account Number" value={displayUser?.account_number || 'Not provided'} compact />
                        <ReadOnlyField label="Bank Branch" value={displayUser?.bank_branch || 'Not provided'} compact />
                      </div>
                    </div>

                    <div className="p-4 bg-[var(--gray-25)] border border-[var(--gray-100)] rounded-2xl flex gap-3.5 items-start">
                      <Lock className="h-5 w-5 text-[var(--gray-400)] mt-0.5 shrink-0" />
                      <p className="text-xs text-[var(--gray-400)] font-medium leading-relaxed">
                        These fields require HR approval to change. Use "Request Change" above - your current values stay in effect until an HR Manager approves your request.
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'contacts' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <Card className="shadow-sm border-[var(--gray-100)] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-base font-bold text-[var(--foreground)]">Emergency Contact & Medical Info</h3>
                    <Button size="sm" onClick={() => setShowContactsModal(true)}>
                      Request Change
                    </Button>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <ReadOnlyField label="Emergency Contact Name" value={pii?.emergencyContactName || 'Not provided'} />
                      <ReadOnlyField label="Emergency Contact Phone" value={pii?.emergencyContactPhone || 'Not provided'} />
                      <ReadOnlyField label="Relationship" value={pii?.emergencyContactRelationship || 'Not provided'} />
                      <ReadOnlyField label="Blood Type" value={pii?.bloodType || 'Not set'} />
                    </div>

                    <div className="p-4 bg-[var(--gray-25)] border border-[var(--gray-100)] rounded-2xl flex gap-3.5 items-start">
                      <Lock className="h-5 w-5 text-[var(--gray-400)] mt-0.5 shrink-0" />
                      <p className="text-xs text-[var(--gray-400)] font-medium leading-relaxed">
                        These fields require HR approval to change. Use "Request Change" above - your current values stay in effect until an HR Manager approves your request.
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'education' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <Card className="shadow-sm border-[var(--gray-100)] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-base font-bold text-[var(--foreground)]">Undergraduate Degree Completion Date</h3>
                    <Button size="sm" variant="outline" onClick={() => setShowDegreeDateModal(true)}>
                      Request Change
                    </Button>
                  </div>
                  <ReadOnlyField icon={GraduationCap} label="Completion Date" value={formattedDegreeDate()} />
                </Card>

                <Card className="shadow-sm border-[var(--gray-100)] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-base font-bold text-[var(--foreground)]">Educational Background</h3>
                    <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setEducationModal({ open: true, record: null })}>
                      Add Record
                    </Button>
                  </div>

                  {educationLoading ? (
                    <p className="text-xs text-[var(--gray-400)]">Loading...</p>
                  ) : education.length === 0 ? (
                    <EmptyState
                      icon={GraduationCap}
                      title="No education records yet"
                      description="Add your qualifications - each addition is sent to HR for approval."
                    />
                  ) : (
                    <div className="space-y-3">
                      {education.map((rec) => (
                        <div
                          key={rec.id}
                          className="flex items-start justify-between gap-3 p-4 bg-[var(--gray-25)] border border-[var(--gray-100)] rounded-2xl"
                        >
                          <div>
                            <p className="text-sm font-bold text-[var(--foreground)] flex items-center gap-2">
                              {rec.qualificationTitle}
                              {rec.isOngoing && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                                  Ongoing
                                </span>
                              )}
                            </p>
                            <p className="text-xs font-semibold text-[var(--primary)] mt-0.5">
                              {qualificationLabel(rec.qualificationLevel)} &middot; {rec.awardingInstitution}
                            </p>
                            {rec.isOngoing ? (
                              <p className="text-[11px] font-medium text-[var(--gray-400)] mt-1">Currently pursuing</p>
                            ) : (
                              rec.dateAwarded && (
                                <p className="text-[11px] font-medium text-[var(--gray-400)] mt-1">
                                  Awarded {format(new Date(rec.dateAwarded), 'MMM yyyy')}
                                </p>
                              )
                            )}
                            {rec.remarks && <p className="text-xs text-[var(--gray-500)] mt-2">{rec.remarks}</p>}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setEducationModal({ open: true, record: rec })}
                              className="p-1.5 rounded-lg text-[var(--gray-400)] hover:text-[var(--primary)] hover:bg-white transition-colors"
                              aria-label="Edit"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteConfirm({ open: true, kind: 'education', record: rec })}
                              className="p-1.5 rounded-lg text-[var(--gray-400)] hover:text-red-500 hover:bg-white transition-colors"
                              aria-label="Remove"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-[11px] text-[var(--gray-400)] font-medium mt-4">
                    Newly added or edited records appear under "Pending Changes" until HR approves them.
                  </p>
                </Card>
              </motion.div>
            )}

            {activeTab === 'work-history' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {workHistory.length > 0 && <ExperienceSummaryCard />}
                <Card className="shadow-sm border-[var(--gray-100)] p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-base font-bold text-[var(--foreground)]">Work History</h3>
                    <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setWorkHistoryModal({ open: true, record: null })}>
                      Add Entry
                    </Button>
                  </div>

                  {workHistoryLoading ? (
                    <p className="text-xs text-[var(--gray-400)]">Loading...</p>
                  ) : workHistory.length === 0 ? (
                    <EmptyState
                      icon={History}
                      title="No work history yet"
                      description="Add your previous roles - each addition is sent to HR for approval."
                    />
                  ) : (
                    <WorkHistoryTimeline
                      entries={workHistory}
                      onEdit={(rec) => setWorkHistoryModal({ open: true, record: rec })}
                      onDelete={(rec) => setDeleteConfirm({ open: true, kind: 'work_history', record: rec })}
                    />
                  )}
                  <p className="text-[11px] text-[var(--gray-400)] font-medium mt-4">
                    Newly added or edited entries appear under "Pending Changes" until HR approves them.
                  </p>
                </Card>
              </motion.div>
            )}

            {activeTab === 'pending-changes' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <Card className="shadow-sm border-[var(--gray-100)] p-6">
                  <h3 className="text-base font-bold text-[var(--foreground)] mb-6">My Change Requests</h3>
                  <DataTable
                    columns={pendingChangeColumns}
                    data={changeRequests}
                    isLoading={changeRequestsLoading}
                    onRowClick={(row) => setSelectedRequest(row)}
                    emptyTitle="No change requests yet"
                    emptyDescription="Requests you submit for profile edits, education, or work history will show up here."
                  />
                </Card>
              </motion.div>
            )}

            {activeTab === 'employment' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <Card className="shadow-sm border-[var(--gray-100)] p-6">
                  <h3 className="text-base font-bold text-[var(--foreground)] mb-6">Employment Information</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3.5">
                      <div className="p-2 bg-[var(--primary-light)] text-[var(--primary)] rounded-xl mt-0.5">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider">Employee ID #</p>
                        <p className="text-sm font-bold text-[var(--foreground)] mt-1">{displayUser?.employee_id || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="p-2 bg-[var(--primary-light)] text-[var(--primary)] rounded-xl mt-0.5">
                        <Shield className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider">Access Access Level / Role</p>
                        <p className="text-sm font-bold text-[var(--foreground)] mt-1 capitalize">{displayUser?.role?.replace('_', ' ') || 'Employee'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="p-2 bg-[var(--primary-light)] text-[var(--primary)] rounded-xl mt-0.5">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider">Department</p>
                        <p className="text-sm font-bold text-[var(--foreground)] mt-1">{displayUser?.department || 'Operations'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="p-2 bg-[var(--primary-light)] text-[var(--primary)] rounded-xl mt-0.5">
                        <User className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider">Job Designation</p>
                        <p className="text-sm font-bold text-[var(--foreground)] mt-1">{displayUser?.position || 'Specialist'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3.5">
                      <div className="p-2 bg-[var(--primary-light)] text-[var(--primary)] rounded-xl mt-0.5">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider">Hire Date</p>
                        <p className="text-sm font-bold text-[var(--foreground)] mt-1">{formattedHireDate()}</p>
                      </div>
                    </div>

                    {displayUser?.hourly_rate && (
                      <div className="flex items-start gap-3.5">
                        <div className="p-2 bg-[var(--primary-light)] text-[var(--primary)] rounded-xl mt-0.5">
                          <DollarSign className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider">Hourly Pay Rate</p>
                          <p className="text-sm font-bold text-[var(--foreground)] mt-1">LKR {displayUser.hourly_rate.toLocaleString()}/hr</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-8 p-4.5 bg-[var(--gray-25)] border border-[var(--gray-100)] rounded-2xl flex gap-3.5 items-start">
                    <Lock className="h-5 w-5 text-[var(--gray-400)] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-[var(--foreground)]">Corporate Access Details</p>
                      <p className="text-xs text-[var(--gray-400)] font-medium mt-1 leading-relaxed">
                        Your core employment records, design assignments, and salary parameters are managed by HR. If any detail above is incorrect, please raise a ticket inside the system.
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'documents' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <Card className="shadow-sm border-[var(--gray-100)] p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-base font-bold text-[var(--foreground)]">Document Vault</h3>
                    <span className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider bg-[var(--gray-50)] border border-[var(--gray-100)] px-2 py-0.5 rounded-full">
                      {myDocuments.reduce((count, doc) => count + (doc.attachments?.length ?? 0), 0)} documents
                    </span>
                  </div>

                  {documentsQuery.isLoading && (
                    <p className="text-sm text-[var(--gray-400)]">Loading documents...</p>
                  )}
                  {!documentsQuery.isLoading && myDocuments.length === 0 && (
                    <p className="text-sm text-[var(--gray-400)]">No documents have been shared with you yet.</p>
                  )}

                  <div className="space-y-3">
                    {myDocuments.flatMap((doc) =>
                      (doc.attachments ?? []).map((attachment) => (
                        <a
                          key={attachment.id}
                          href={resolveFileUrl(attachment.fileUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between p-4 bg-[var(--gray-25)] hover:bg-[var(--gray-50)] border border-[var(--gray-100)] hover:border-[var(--primary-ring)] rounded-2xl transition-all duration-200"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white text-[var(--primary)] border border-[var(--gray-100)] rounded-xl shrink-0">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-[var(--foreground)] truncate max-w-[200px] sm:max-w-md">{attachment.fileName}</p>
                              <span className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider block mt-0.5">
                                {doc.title}
                              </span>
                            </div>
                          </div>

                          <span
                            className="p-2 bg-white text-[var(--gray-500)] hover:text-[var(--primary)] border border-[var(--gray-100)] hover:border-[var(--primary-ring)] rounded-xl hover:shadow-sm transition-colors shrink-0"
                            title="Download Document"
                          >
                            <Download className="h-4 w-4" />
                          </span>
                        </a>
                      ))
                    )}
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <Card className="shadow-sm border-[var(--gray-100)] p-6">
                  <h3 className="text-base font-bold text-[var(--foreground)] mb-6">System & Notification Preferences</h3>

                  <div className="space-y-5">
                    <div className="flex items-center justify-between p-4 bg-[var(--gray-25)] border border-[var(--gray-100)] rounded-2xl">
                      <div className="flex gap-3 items-start pr-4">
                        <Bell className="h-4 w-4 text-[var(--gray-400)] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-[var(--foreground)]">Email Alerts</p>
                          <p className="text-[10px] font-medium text-[var(--gray-400)] mt-0.5 leading-relaxed">
                            Receive notifications about salary updates, leave balance allocations, and claims reports.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleSetting('emailNotifications')}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          settings.emailNotifications ? 'bg-[var(--primary)]' : 'bg-[var(--gray-200)]'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            settings.emailNotifications ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[var(--gray-25)] border border-[var(--gray-100)] rounded-2xl">
                      <div className="flex gap-3 items-start pr-4">
                        <Bell className="h-4 w-4 text-[var(--gray-400)] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-[var(--foreground)]">Push Notifications</p>
                          <p className="text-[10px] font-medium text-[var(--gray-400)] mt-0.5 leading-relaxed">
                            Show desktop announcements and important corporate updates.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleSetting('pushNotifications')}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          settings.pushNotifications ? 'bg-[var(--primary)]' : 'bg-[var(--gray-200)]'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            settings.pushNotifications ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-[var(--gray-25)] border border-[var(--gray-100)] rounded-2xl">
                      <div className="flex gap-3 items-start pr-4">
                        <FileText className="h-4 w-4 text-[var(--gray-400)] mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-[var(--foreground)]">Weekly Reports Digest</p>
                          <p className="text-[10px] font-medium text-[var(--gray-400)] mt-0.5 leading-relaxed">
                            A weekly consolidated email containing leave records, claims updates, and calendar bookings.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleSetting('weeklyReport')}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          settings.weeklyReport ? 'bg-[var(--primary)]' : 'bg-[var(--gray-200)]'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            settings.weeklyReport ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <ProfileChangeRequestModal
        isOpen={showChangeRequestModal}
        onClose={() => setShowChangeRequestModal(false)}
        user={displayUser}
        pii={pii}
      />

      <ContactDetailsChangeModal
        isOpen={showContactsModal}
        onClose={() => setShowContactsModal(false)}
        pii={pii}
      />

      <DegreeDateChangeModal
        isOpen={showDegreeDateModal}
        onClose={() => setShowDegreeDateModal(false)}
        currentDate={displayUser?.undergraduate_degree_completion_date}
      />

      <EducationChangeModal
        isOpen={educationModal.open}
        onClose={() => setEducationModal({ open: false, record: null })}
        initialData={educationModal.record}
      />

      <WorkHistoryChangeModal
        isOpen={workHistoryModal.open}
        onClose={() => setWorkHistoryModal({ open: false, record: null })}
        initialData={workHistoryModal.record}
      />

      <ConfirmationDialog
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false })}
        onConfirm={confirmDelete}
        title="Remove Record"
        message="This will submit a change request to remove this record. It stays visible until HR approves the removal."
        confirmLabel="Submit Request"
        variant="danger"
        isLoading={submitChange.isPending}
      />

      <ProfileChangeDiffModal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
        canDecide={false}
      />
    </div>
  );
}

function ReadOnlyField({
  icon: Icon,
  label,
  value,
  compact = false,
}: {
  icon?: React.ElementType;
  label: string;
  value?: string | null;
  compact?: boolean;
}) {
  return (
    <div>
      <label className={`block font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2 ${compact ? 'text-[10px]' : 'text-[10px]'}`}>
        {label}
      </label>
      <div
        className={`flex items-center gap-2 w-full px-3.5 border border-[var(--gray-100)] rounded-xl font-semibold text-[var(--gray-500)] bg-[var(--gray-25)] ${
          compact ? 'py-2 text-xs' : 'py-2.5 text-sm'
        }`}
      >
        {Icon && <Icon className="h-3.5 w-3.5 text-[var(--gray-400)] shrink-0" />}
        <span className="truncate">{value || '—'}</span>
      </div>
    </div>
  );
}
