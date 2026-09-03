'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Stepper, StepPanel, type StepDefinition } from '@/components/ui/Stepper';
import { useToast } from '@/contexts/ToastContext';
import { useProfileQuery } from '@/hooks/queries/use-profile-query';
import { useEmployeePersonalDetailsQuery } from '@/hooks/queries/use-employee-personal-details-query';
import { useEmployeeNomineesQuery } from '@/hooks/queries/use-employee-nominees-query';
import { useEmployeeDependentsQuery } from '@/hooks/queries/use-employee-dependents-query';
import { useEmployeeEmergencyContactsQuery } from '@/hooks/queries/use-employee-emergency-contacts-query';
import { useEmployeeWelfareInfoQuery } from '@/hooks/queries/use-employee-welfare-info-query';
import { useSubmitProfileChangeMutation } from '@/hooks/mutations/use-submit-profile-change-mutation';
import StepStatutory from '@/components/profile/wizard/StepStatutory';
import StepRemittance from '@/components/profile/wizard/StepRemittance';
import StepDependents from '@/components/profile/wizard/StepDependents';
import StepEmergencyContacts from '@/components/profile/wizard/StepEmergencyContacts';
import StepWelfare from '@/components/profile/wizard/StepWelfare';
import { buildDefaultValues, type WizardFormValues } from '@/components/profile/wizard/wizardTypes';
import { buildWizardChanges } from '@/components/profile/wizard/wizardDiff';

const STEPS: StepDefinition[] = [
  { key: 'statutory', label: 'Statutory Info' },
  { key: 'remittance', label: 'Remittance' },
  { key: 'dependents', label: 'Medical & Welfare' },
  { key: 'emergency', label: 'Emergency Contacts' },
  { key: 'welfare', label: 'Welfare' },
];

// Fields validated (via RHF trigger) before "Next" advances past each step.
// The final tab (Welfare) has no required fields.
const STEP_FIELD_NAMES: (keyof WizardFormValues)[][] = [
  [
    'nationalId',
    'legalName',
    'initialsName',
    'permanentAddressLine1',
    'permanentCity',
    'permanentDistrict',
    'dateOfBirth',
    'birthPlace',
    'sex',
    'maritalStatus',
    'nationality',
    'mobileNumber',
    'motherName',
    'fatherName',
    'nominees',
  ],
  ['accountHolderName', 'accountNumber', 'bankName', 'bankBranch'],
  ['dependents'],
  ['emergencyContacts'],
  [],
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

  const isLoading = !profile || piiLoading || nomineesLoading || dependentsLoading || contactsLoading || welfareLoading;

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
      defaultValues={buildDefaultValues({ user: profile, pii, nominees, dependents, emergencyContacts, welfareInfo })}
      email={profile?.email ?? ''}
      designation={profile?.position ?? ''}
      onDone={() => router.push('/profile')}
    />
  );
}

function ProfileWizardForm({
  defaultValues,
  email,
  designation,
  onDone,
}: {
  defaultValues: WizardFormValues;
  email: string;
  designation: string;
  onDone: () => void;
}) {
  const toast = useToast();
  const submitChange = useSubmitProfileChangeMutation();
  const [stepIndex, setStepIndex] = useState(0);
  const form = useForm<WizardFormValues>({ defaultValues });
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
    const changes = buildWizardChanges(defaultValues, form.getValues());
    if (changes.length === 0) {
      toast.info('No changes detected', 'Update at least one field before submitting.');
      return;
    }
    try {
      await submitChange.mutateAsync({ changes });
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
          {currentKey === 'statutory' && <StepStatutory form={form} email={email} designation={designation} />}
          {currentKey === 'remittance' && <StepRemittance form={form} />}
          {currentKey === 'dependents' && <StepDependents form={form} isMarried={isMarried} />}
          {currentKey === 'emergency' && <StepEmergencyContacts form={form} />}
          {currentKey === 'welfare' && <StepWelfare form={form} />}
        </StepPanel>

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
