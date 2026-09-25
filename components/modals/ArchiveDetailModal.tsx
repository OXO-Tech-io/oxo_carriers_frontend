'use client';

import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { ArchivedEmployee } from '@/types/archive';
import { format } from 'date-fns';

function formatDate(value?: string | null) {
  if (!value) return '—';
  try {
    return format(new Date(value), 'MMM dd, yyyy');
  } catch {
    return value;
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  try {
    return format(new Date(value), 'MMM dd, yyyy, h:mm a');
  } catch {
    return value;
  }
}

// The snapshot is an arbitrary stored JSON blob (see types/archive.ts) - this
// reads a single field out of it as a display-safe primitive without
// resorting to `any` casts at every call site.
function pick(record: unknown, key: string): string | number | null {
  if (!record || typeof record !== 'object') return null;
  const value = (record as Record<string, unknown>)[key];
  if (value === undefined || value === null) return null;
  if (typeof value === 'string' || typeof value === 'number') return value;
  return String(value);
}

function pickKey(record: unknown, fallback: number): string | number {
  const id = pick(record, 'id');
  return id ?? fallback;
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider">{label}</p>
      <p className="text-xs font-semibold text-[var(--foreground)] mt-0.5 break-words">
        {value === undefined || value === null || value === '' ? '—' : String(value)}
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--gray-100)] overflow-hidden">
      <div className="px-4 py-2.5 bg-[var(--gray-25)] border-b border-[var(--gray-100)]">
        <p className="text-xs font-bold text-[var(--foreground)]">{title}</p>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

interface ArchiveDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ArchivedEmployee | null;
}

export default function ArchiveDetailModal({ isOpen, onClose, record }: ArchiveDetailModalProps) {
  if (!record) return null;
  const { employee, personalDetails, nominees, dependents, emergencyContacts, welfareInfo, education, workHistory } =
    record.snapshot;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Archived Employee Profile"
      size="xl"
      footer={
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-bold text-amber-800">
            Deleted {formatDateTime(record.deletedAt)} by {record.deletedByName || 'Unknown'}
          </p>
          <p className="text-[11px] text-amber-700 mt-1">
            This profile was captured exactly as it existed at the moment of deletion. It cannot be edited.
          </p>
        </div>

        <Section title="Basic Information">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Employee ID" value={pick(employee, 'employeeId')} />
            <Field label="Full Name" value={`${pick(employee, 'firstName') ?? ''} ${pick(employee, 'lastName') ?? ''}`.trim()} />
            <Field label="Email" value={pick(employee, 'email')} />
            <Field label="Role" value={pick(employee, 'role')} />
            <Field label="Department" value={pick(employee, 'department')} />
            <Field label="Position" value={pick(employee, 'position')} />
            <Field label="Status" value={pick(employee, 'status')} />
            <Field label="Hire Date" value={formatDate(pick(employee, 'hireDate') as string | null)} />
            <Field label="Contact Number" value={pick(employee, 'contactNumber')} />
          </div>
        </Section>

        {personalDetails && (
          <Section title="Personal Details">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="National ID" value={pick(personalDetails, 'nationalId')} />
              <Field label="Address" value={pick(personalDetails, 'addressLine1')} />
              <Field label="City" value={pick(personalDetails, 'city')} />
              <Field label="District" value={pick(personalDetails, 'district')} />
              <Field label="Blood Type" value={pick(personalDetails, 'bloodType')} />
              <Field label="Emergency Contact" value={pick(personalDetails, 'emergencyContactName')} />
            </div>
          </Section>
        )}

        {nominees.length > 0 && (
          <Section title={`Nominees (${nominees.length})`}>
            <div className="space-y-3">
              {nominees.map((n, idx) => (
                <div key={pickKey(n, idx)} className="grid grid-cols-1 sm:grid-cols-4 gap-3 pb-3 border-b border-[var(--gray-50)] last:border-0 last:pb-0">
                  <Field label="Name" value={pick(n, 'nameWithInitials')} />
                  <Field label="NIC" value={pick(n, 'nic')} />
                  <Field label="Relationship" value={pick(n, 'relationship')} />
                  <Field label="Proportion" value={pick(n, 'proportionPercent') ? `${pick(n, 'proportionPercent')}%` : null} />
                </div>
              ))}
            </div>
          </Section>
        )}

        {dependents.length > 0 && (
          <Section title={`Dependents (${dependents.length})`}>
            <div className="space-y-3">
              {dependents.map((d, idx) => (
                <div key={pickKey(d, idx)} className="grid grid-cols-1 sm:grid-cols-4 gap-3 pb-3 border-b border-[var(--gray-50)] last:border-0 last:pb-0">
                  <Field label="Name" value={pick(d, 'fullName')} />
                  <Field label="Relationship" value={pick(d, 'relationship')} />
                  <Field label="Date of Birth" value={formatDate(pick(d, 'dateOfBirth') as string | null)} />
                  <Field label="NIC" value={pick(d, 'nic')} />
                </div>
              ))}
            </div>
          </Section>
        )}

        {emergencyContacts.length > 0 && (
          <Section title={`Emergency Contacts (${emergencyContacts.length})`}>
            <div className="space-y-3">
              {emergencyContacts.map((c, idx) => (
                <div key={pickKey(c, idx)} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-3 border-b border-[var(--gray-50)] last:border-0 last:pb-0">
                  <Field label="Name" value={pick(c, 'name')} />
                  <Field label="Relationship" value={pick(c, 'relationship')} />
                  <Field label="Contact Number" value={pick(c, 'contactNumber')} />
                </div>
              ))}
            </div>
          </Section>
        )}

        {welfareInfo && (
          <Section title="Welfare Information">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Wedding Anniversary" value={formatDate(pick(welfareInfo, 'weddingAnniversaryDate') as string | null)} />
              <Field label="Hobbies" value={pick(welfareInfo, 'hobbies')} />
              <Field label="Community Activities" value={pick(welfareInfo, 'communityActivities')} />
            </div>
          </Section>
        )}

        {education.length > 0 && (
          <Section title={`Education (${education.length})`}>
            <div className="space-y-3">
              {education.map((e, idx) => (
                <div key={pickKey(e, idx)} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-3 border-b border-[var(--gray-50)] last:border-0 last:pb-0">
                  <Field label="Qualification" value={pick(e, 'qualificationTitle')} />
                  <Field label="Institution" value={pick(e, 'awardingInstitution')} />
                  <Field label="Date Awarded" value={formatDate(pick(e, 'dateAwarded') as string | null)} />
                </div>
              ))}
            </div>
          </Section>
        )}

        {workHistory.length > 0 && (
          <Section title={`Work History (${workHistory.length})`}>
            <div className="space-y-3">
              {workHistory.map((w, idx) => {
                const endDate = pick(w, 'endDate');
                return (
                  <div key={pickKey(w, idx)} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-3 border-b border-[var(--gray-50)] last:border-0 last:pb-0">
                    <Field label="Organization" value={pick(w, 'organization')} />
                    <Field label="Position" value={pick(w, 'positionHeld')} />
                    <Field
                      label="Period"
                      value={`${formatDate(pick(w, 'startDate') as string | null)} – ${endDate ? formatDate(endDate as string) : 'Present'}`}
                    />
                  </div>
                );
              })}
            </div>
          </Section>
        )}
      </div>
    </Modal>
  );
}
