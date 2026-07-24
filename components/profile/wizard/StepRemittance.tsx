'use client';

import { UseFormReturn } from 'react-hook-form';
import { Field, SectionTitle, inputClass } from './shared';
import type { WizardFormValues } from './wizardTypes';

interface StepProps {
  form: UseFormReturn<WizardFormValues>;
}

export default function StepRemittance({ form }: StepProps) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <SectionTitle>Residing Address (if different from the permanent address)</SectionTitle>
        <Field label="Address Line 1">
          <input {...register('residingAddressLine1')} className={inputClass} />
        </Field>
        <Field label="Address Line 2">
          <input {...register('residingAddressLine2')} className={inputClass} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="City">
            <input {...register('residingCity')} className={inputClass} />
          </Field>
          <Field label="District">
            <input {...register('residingDistrict')} className={inputClass} />
          </Field>
        </div>
        <Field label="Landline Number (if available)">
          <input {...register('landlineNumber')} className={inputClass} />
        </Field>
      </div>

      <div className="bg-[var(--gray-25)] p-4 rounded-2xl border border-[var(--gray-50)] space-y-4">
        <SectionTitle>Bank Account Details</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name as in Bank A/C" error={errors.accountHolderName?.message}>
            <input {...register('accountHolderName', { required: 'Account holder name is required' })} className={inputClass} />
          </Field>
          <Field label="Bank A/C Number" error={errors.accountNumber?.message}>
            <input {...register('accountNumber', { required: 'Account number is required' })} className={inputClass} />
          </Field>
          <Field label="Bank" error={errors.bankName?.message}>
            <input {...register('bankName', { required: 'Bank is required' })} className={inputClass} />
          </Field>
          <Field label="Branch" error={errors.bankBranch?.message}>
            <input {...register('bankBranch', { required: 'Branch is required' })} className={inputClass} />
          </Field>
          <Field label="Branch Code">
            <input {...register('bankBranchCode')} className={inputClass} />
          </Field>
          <Field label="Swift Code">
            <input {...register('swiftCode')} className={inputClass} />
          </Field>
        </div>
      </div>
    </div>
  );
}
