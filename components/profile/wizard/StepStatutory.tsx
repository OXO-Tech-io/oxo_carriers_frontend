'use client';

import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { SEX_OPTIONS, MARITAL_STATUS_OPTIONS } from '@/types/profile';
import { Field, RepeatableCard, SectionTitle, inputClass } from './shared';
import type { WizardFormValues } from './wizardTypes';

interface StepProps {
  form: UseFormReturn<WizardFormValues>;
  email: string;
  designation: string;
}

const MAX_NOMINEES = 2;

export default function StepStatutory({ form, email, designation }: StepProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'nominees' });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="National Identity Card Number" error={errors.nationalId?.message}>
          <input {...register('nationalId', { required: 'NIC number is required' })} className={inputClass} />
        </Field>
        <Field label="Full Name as in NIC" error={errors.legalName?.message}>
          <input {...register('legalName', { required: 'Full name is required' })} className={inputClass} />
        </Field>
        <Field label="Name with Initials" error={errors.initialsName?.message}>
          <input {...register('initialsName', { required: 'Name with initials is required' })} className={inputClass} />
        </Field>
        <Field label="Designation">
          <input value={designation} disabled className={inputClass} />
        </Field>
      </div>

      <div className="space-y-3">
        <SectionTitle>Permanent Address</SectionTitle>
        <Field label="Address Line 1" error={errors.permanentAddressLine1?.message}>
          <input {...register('permanentAddressLine1', { required: 'Address line 1 is required' })} className={inputClass} />
        </Field>
        <Field label="Address Line 2">
          <input {...register('permanentAddressLine2')} className={inputClass} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="City" error={errors.permanentCity?.message}>
            <input {...register('permanentCity', { required: 'City is required' })} className={inputClass} />
          </Field>
          <Field label="District" error={errors.permanentDistrict?.message}>
            <input {...register('permanentDistrict', { required: 'District is required' })} className={inputClass} />
          </Field>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Date of Birth" error={errors.dateOfBirth?.message}>
          <input type="date" {...register('dateOfBirth', { required: 'Date of birth is required' })} className={inputClass} />
        </Field>
        <Field label="Birth Place" error={errors.birthPlace?.message}>
          <input {...register('birthPlace', { required: 'Birth place is required' })} className={inputClass} />
        </Field>
        <Field label="Sex" error={errors.sex?.message}>
          <select {...register('sex', { required: 'Sex is required' })} className={inputClass}>
            <option value="">Select</option>
            {SEX_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Married or Single" error={errors.maritalStatus?.message}>
          <select {...register('maritalStatus', { required: 'Marital status is required' })} className={inputClass}>
            <option value="">Select</option>
            {MARITAL_STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nationality" error={errors.nationality?.message}>
          <input {...register('nationality', { required: 'Nationality is required' })} className={inputClass} />
        </Field>
        <Field label="Mobile Number" error={errors.mobileNumber?.message}>
          <input {...register('mobileNumber', { required: 'Mobile number is required' })} className={inputClass} />
        </Field>
        <Field label="Email">
          <input value={email} disabled className={inputClass} />
        </Field>
        <Field label="Name of the Spouse (with initials)">
          <input {...register('spouseName')} className={inputClass} />
        </Field>
        <Field label="Name of the Mother (with initials)" error={errors.motherName?.message}>
          <input {...register('motherName', { required: "Mother's name is required" })} className={inputClass} />
        </Field>
        <Field label="Name of the Father (with initials)" error={errors.fatherName?.message}>
          <input {...register('fatherName', { required: "Father's name is required" })} className={inputClass} />
        </Field>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionTitle>Nominees (1-2 family members registered as EPF/ETF beneficiaries)</SectionTitle>
          {fields.length < MAX_NOMINEES && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ id: null, nameWithInitials: '', nic: '', relationship: '', proportionPercent: '' })}
            >
              Add Nominee
            </Button>
          )}
        </div>
        {fields.length === 0 && (
          <p className="text-xs text-[var(--gray-400)] font-medium">No nominees added yet.</p>
        )}
        {fields.map((f, index) => (
          <RepeatableCard key={f.id} title={`Nominee ${index + 1}`} onRemove={() => remove(index)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Name with Initials" error={errors.nominees?.[index]?.nameWithInitials?.message}>
                <input
                  {...register(`nominees.${index}.nameWithInitials`, { required: 'Name is required' })}
                  className={inputClass}
                />
              </Field>
              <Field label="National Identity Card Number" error={errors.nominees?.[index]?.nic?.message}>
                <input {...register(`nominees.${index}.nic`, { required: 'NIC is required' })} className={inputClass} />
              </Field>
              <Field label="Relationship" error={errors.nominees?.[index]?.relationship?.message}>
                <input
                  {...register(`nominees.${index}.relationship`, { required: 'Relationship is required' })}
                  className={inputClass}
                />
              </Field>
              <Field label="Proportion (%)" error={errors.nominees?.[index]?.proportionPercent?.message}>
                <input
                  type="number"
                  min={0}
                  max={100}
                  {...register(`nominees.${index}.proportionPercent`, { required: 'Proportion is required' })}
                  className={inputClass}
                />
              </Field>
            </div>
          </RepeatableCard>
        ))}
      </div>
    </div>
  );
}
