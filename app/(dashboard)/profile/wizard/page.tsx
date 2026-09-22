'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';
import { Stepper, StepPanel, type StepDefinition } from '@/components/ui/Stepper';
import { useToast } from '@/contexts/ToastContext';
import { useProfileQuery } from '@/hooks/queries/use-profile-query';
import { useEmployeePersonalDetailsQuery } from '@/hooks/queries/use-employee-personal-details-query';
import { useEmployeeNomineesQuery } from '@/hooks/queries/use-employee-nominees-query';
import { useEmployeeDependentsQuery } from '@/hooks/queries/use-employee-dependents-query';
import { useEmployeeEmergencyContactsQuery } from '@/hooks/queries/use-employee-emergency-contacts-query';
import { useEmployeeWelfareInfoQuery } from '@/hooks/queries/use-employee-welfare-info-query';
import { useEmployeeEducationQuery } from '@/hooks/queries/use-employee-education-query';
import { useEmployeeWorkHistoryQuery } from '@/hooks/queries/use-employee-work-history-query';
import { useSubmitProfileChangeMutation } from '@/hooks/mutations/use-submit-profile-change-mutation';
import StepStatutory from '@/components/profile/wizard/StepStatutory';
import StepRemittance from '@/components/profile/wizard/StepRemittance';
import StepDependents from '@/components/profile/wizard/StepDependents';
import StepEmergencyContacts from '@/components/profile/wizard/StepEmergencyContacts';
import StepWelfare from '@/components/profile/wizard/StepWelfare';
// OCD-456: Education & Work History are reused verbatim from the Create
// Employee wizard - neither component references anything admin/role-only,
// so they're safe to reuse here exactly as StepStatutory/StepRemittance/etc.
// are already reused in the opposite direction by CreateUserModal.tsx.
import StepEducation from '@/components/modals/employee-wizard/StepEducation';
import StepWorkHistory from '@/components/modals/employee-wizard/StepWorkHistory';
import type { EmployeeWizardValues } from '@/components/modals/employee-wizard/wizardTypes';
import { buildDefaultValues, type WizardFormValues } from '@/components/profile/wizard/wizardTypes';
import { buildWizardChanges } from '@/components/profile/wizard/wizardDiff';

// OCD-456: unified with Create Employee's own step order (EMPLOYEE_STEPS in
// CreateUserModal.tsx), minus the admin-only Basic Info/Employment
// Details/Review & Confirm steps the ticket explicitly excludes from
// self-service editing.
const STEPS: StepDefinition[] = [
  { key: 'statutory', label: 'Statutory Info' },
  { key: 'remittance', label: 'Remittance' },
  { key: 'dependents', label: 'Medical & Welfare' },
  { key: 'emergency', label: 'Emergency Contacts' },
  { key: 'welfare', label: 'Welfare' },
  { key: 'education', label: 'Education' },
  { key: 'workHistory', label: 'Work History' },
];

// Fields validated (via RHF trigger) before "Next"/final submit advances
// past each step. Every field with a `validate` rule (not just `required`
// ones) must be listed here - RHF's `trigger()` only checks the exact field
// names it's given, so a format-only rule (e.g. noEmoji, validateNic,
// validateLinkedInUrl) would otherwise never actually block progress
// (OCD-413/416/417/419/420/427/429/433).
const STEP_FIELD_NAMES: (keyof WizardFormValues)[][] = [
  [
    'nationalId',
    'legalName',
    'initialsName',
    'callingName',
    'permanentAddressLine1',
    'permanentAddressLine2',
    'permanentCity',
    'permanentDistrict',
    'gramaNiladariDivision',
    'electorate',
    'postalCode',
    'dateOfBirth',
    'birthPlace',
    'sex',
    'maritalStatus',
    'nationality',
    'religion',
    'mobileNumber',
    'secondaryContactNumber',
    'spouseName',
    'spouseNic',
    'spouseDateOfBirth',
    'spouseContactNumber',
    'spouseOccupation',
    'motherName',
    'motherOccupation',
    'motherContactNumber',
    'fatherName',
    'fatherOccupation',
    'fatherContactNumber',
    'siblingDetails',
    'nominees',
  ],
  [
    'residingAddressLine1',
    'residingAddressLine2',
    'residingCity',
    'residingDistrict',
    'landlineNumber',
    'accountHolderName',
    'accountNumber',
    'bankName',
    'bankBranch',
    'bankBranchCode',
    'swiftCode',
  ],
  ['dependents'],
  ['emergencyContacts', 'bloodType', 'medicalConditions', 'allergies'],
  ['weddingAnniversaryDate', 'hobbies', 'communityActivities', 'professionalMemberships', 'linkedinProfile', 'additionalNotes'],
  // OCD-456: mirrors stepFieldNames('education', ...) in CreateUserModal.tsx -
  // undergraduateDegreeCompletionDate has no validate/required rule so it's
  // deliberately omitted here too.
  ['education', 'primarySchoolAttended', 'secondarySchoolAttended'],
  ['workHistory'],
];

export default function ProfileWizardPage() {
  const router = useRouter();
  const { data: profile } = useProfileQuery();
  const { data: pii, isLoading: piiLoading } = useEmployeePersonalDetailsQuery(profile?.id, { enabled: !!profile?.id });
  const { data: nominees, isLoading: nomineesLoading } = useEmployeeNomineesQuery(profile?.id, {
    enabled: !!profile?.id,
  });
  const { data: dependents, isLoading: dependentsLoading } = useEmployeeDependentsQuery(profile?.id, {
    enabled: !!profile?.id,
  });
  const { data: emergencyContacts, isLoading: contactsLoading } = useEmployeeEmergencyContactsQuery(
    profile?.id,
    { enabled: !!profile?.id }
  );
  const { data: welfareInfo, isLoading: welfareLoading } = useEmployeeWelfareInfoQuery(profile?.id, {
    enabled: !!profile?.id,
  });
  const { data: education, isLoading: educationLoading } = useEmployeeEducationQuery();
  const { data: workHistory, isLoading: workHistoryLoading } = useEmployeeWorkHistoryQuery();

  const isLoading =
    !profile ||
    piiLoading ||
    nomineesLoading ||
    dependentsLoading ||
    contactsLoading ||
    welfareLoading ||
    educationLoading ||
    workHistoryLoading;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <Card padding="lg">
          <p className="text-sm text-[var(--gray-400)] font-medium">Loading your profile…</p>
        </Card>
      </div>
    );
  }

  return (
    <ProfileWizardForm
      defaultValues={buildDefaultValues({
        user: profile,
        pii,
        nominees,
        dependents,
        emergencyContacts,
        welfareInfo,
        education,
        workHistory,
      })}
      email={profile?.email ?? ''}
      designation={profile?.position ?? ''}
      // OCD-444: lets StepStatutory/StepRemittance's duplicate NIC/bank
      // account checks exclude this employee's own already-saved value.
      currentEmployeeId={profile?.employee_id}
      onDone={() => router.push('/profile')}
    />
  );
}

function ProfileWizardForm({
  defaultValues,
  email,
  designation,
  currentEmployeeId,
  onDone,
}: {
  defaultValues: WizardFormValues;
  email: string;
  designation: string;
  currentEmployeeId?: string;
  onDone: () => void;
}) {
  const toast = useToast();
  const submitChange = useSubmitProfileChangeMutation();
  const [stepIndex, setStepIndex] = useState(0);
  // OCD-478: optional "Reason for Change" + supporting documents, collected
  // on the final step only - kept local to this component rather than added
  // to the RHF form since they don't belong to any wizard step's own field
  // set and aren't part of the diff sent per-field via buildWizardChanges.
  const [reasonForChange, setReasonForChange] = useState('');
  const [changeDocuments, setChangeDocuments] = useState<File[]>([]);
  const form = useForm<WizardFormValues>({ defaultValues });
  // EmployeeWizardValues extends WizardFormValues with the same field names/
  // types for education/workHistory (see wizardTypes.ts), so this cast lets
  // StepEducation/StepWorkHistory - written against EmployeeWizardValues for
  // Create Employee - be reused verbatim here, mirroring the reverse cast
  // CreateUserModal.tsx already does for the other Step* components.
  const employeeForm = form as unknown as UseFormReturn<EmployeeWizardValues>;
  const maritalStatus = form.watch('maritalStatus');
  const isMarried = maritalStatus === 'married';

  const steps = STEPS.map((s) => (s.key === 'dependents' ? { ...s, disabled: !isMarried } : s));
  const dependentsIndex = STEPS.findIndex((s) => s.key === 'dependents');

  const goNext = async () => {
    const fieldNames = STEP_FIELD_NAMES[stepIndex];
    const valid = fieldNames.length === 0 ? true : await form.trigger(fieldNames as any);
    if (!valid) return;
    let nextIndex = stepIndex + 1;
    if (nextIndex === dependentsIndex && !isMarried) nextIndex += 1;
    setStepIndex(Math.min(nextIndex, steps.length - 1));
  };

  const goBack = () => {
    let prevIndex = stepIndex - 1;
    if (prevIndex === dependentsIndex && !isMarried) prevIndex -= 1;
    setStepIndex(Math.max(prevIndex, 0));
  };

  // "View all steps" only lets you jump back to an already-completed step -
  // stepping forward would skip that step's own required-field validation.
  const goToStep = (index: number) => {
    if (index <= stepIndex) setStepIndex(index);
  };

  const handleFinalSubmit = async () => {
    // "Submit for Approval" on the last step (Work History) never went
    // through goNext's trigger() call, so its own fields were never
    // actually validated before this ran. Mirrors CreateUserModal.tsx's
    // equivalent trigger before its own final submit.
    const fieldNames = STEP_FIELD_NAMES[stepIndex];
    const valid = fieldNames.length === 0 ? true : await form.trigger(fieldNames as any);
    if (!valid) return;

    const changes = buildWizardChanges(defaultValues, form.getValues());
    if (changes.length === 0) {
      toast.info('No changes detected', 'Update at least one field before submitting.');
      return;
    }
    try {
      await submitChange.mutateAsync({
        changes,
        comments: reasonForChange.trim() || undefined,
        files: changeDocuments.length ? changeDocuments : undefined,
      });
      toast.success('Change request submitted', 'HR will review your requested changes shortly.');
      onDone();
    } catch {
      toast.error('Failed to submit change request', 'Please try again.');
    }
  };

  const isLastStep = stepIndex === steps.length - 1;
  const currentKey = steps[stepIndex].key;

  return (
    <div className="max-w-full mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-xl font-extrabold text-[var(--foreground)]">Employee Profile</h1>
        <p className="text-xs text-[var(--gray-400)] font-medium mt-1">
          Complete each tab and submit at the end. HR will review your changes before they take effect.
        </p>
      </div>

      <Card padding="lg">
        <Stepper steps={steps} currentIndex={stepIndex} onStepClick={goToStep} />
      </Card>

      <Card padding="lg">
        <StepPanel stepKey={currentKey}>
          {currentKey === 'statutory' && (
            <StepStatutory form={form} email={email} designation={designation} currentEmployeeId={currentEmployeeId} />
          )}
          {currentKey === 'remittance' && <StepRemittance form={form} currentEmployeeId={currentEmployeeId} />}
          {currentKey === 'dependents' && <StepDependents form={form} isMarried={isMarried} />}
          {currentKey === 'emergency' && <StepEmergencyContacts form={form} />}
          {currentKey === 'welfare' && <StepWelfare form={form} />}
          {currentKey === 'education' && <StepEducation form={employeeForm} />}
          {currentKey === 'workHistory' && <StepWorkHistory form={employeeForm} />}
        </StepPanel>

        {/* OCD-478: optional Reason for Change + supporting documents,
            shown only on the final step, right before "Submit for Approval". */}
        {isLastStep && (
          <div className="mt-8 pt-6 border-t border-[var(--gray-100)] space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[var(--foreground)]">Supporting Information (Optional)</h3>
              <p className="text-xs text-[var(--gray-400)] font-medium mt-1">
                Give HR context for these changes and attach any supporting documents (e.g. NIC copy, address proof,
                marriage certificate, educational certificate).
              </p>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">
                Reason for Change
              </label>
              <textarea
                value={reasonForChange}
                onChange={(e) => setReasonForChange(e.target.value)}
                rows={3}
                placeholder="Explain why you're requesting these changes..."
                className="w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-ring)]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">
                Supporting Documents
              </label>
              <FileUpload
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                maxSizeMB={10}
                onFilesSelected={setChangeDocuments}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-[var(--gray-100)]">
          <Button type="button" variant="outline" onClick={goBack} disabled={stepIndex === 0}>
            Back
          </Button>
          {isLastStep ? (
            <Button type="button" onClick={handleFinalSubmit} isLoading={submitChange.isPending}>
              Submit for Approval
            </Button>
          ) : (
            <Button type="button" onClick={goNext}>
              Next
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
