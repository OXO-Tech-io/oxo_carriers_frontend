'use client';

import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { DEPENDENT_RELATIONSHIP_OPTIONS, SEX_OPTIONS } from '@/types/profile';
import { Field, RepeatableCard, inputClass } from './shared';
import type { WizardFormValues } from './wizardTypes';
import { noEmoji, noFutureDate, validateNic, validateMobileNumber, MOBILE_NUMBER_HINT } from '@/lib/validation/textValidation';

interface StepProps {
  form: UseFormReturn<WizardFormValues>;
  isMarried: boolean;
}

export default function StepDependents({ form, isMarried }: StepProps) {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'dependents' });
  const dependentValues = watch('dependents');

  if (!isMarried) {
    return (
      <div className="rounded-2xl border border-[var(--gray-100)] bg-[var(--gray-25)] p-6 text-center">
        <p className="text-sm font-semibold text-[var(--foreground)]">This tab is only available for married employees.</p>
        <p className="text-xs text-[var(--gray-400)] mt-1">
          Set &quot;Married or Single&quot; to Married on the Statutory Information tab to add family members here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[var(--gray-400)] font-medium">
          Add family members to be registered for medical insurance and welfare benefits. Your spouse is added here
          automatically from the details entered on the Statutory Information tab.
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            append({
              id: null,
              fullName: '',
              nic: '',
              dateOfBirth: '',
              gender: '',
              relationship: '',
              mobileNumber: '',
              school: '',
            })
          }
        >
          Add Family Member
        </Button>
      </div>
      {fields.length === 0 && <p className="text-xs text-[var(--gray-400)] font-medium">No family members added yet.</p>}
      {fields.map((f, index) => (
        <RepeatableCard
          key={f.id}
          title={dependentValues?.[index]?.relationship === 'spouse' ? 'Spouse (from Statutory Info)' : `Family Member ${index + 1}`}
          onRemove={() => remove(index)}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full Name" required error={errors.dependents?.[index]?.fullName?.message}>
              <input
                {...register(`dependents.${index}.fullName`, { required: 'Full name is required', validate: noEmoji })}
                className={inputClass}
              />
            </Field>
            <Field
              label="NIC Number (not applicable for children under 16)"
              error={errors.dependents?.[index]?.nic?.message}
            >
              <input {...register(`dependents.${index}.nic`, { validate: validateNic })} className={inputClass} />
            </Field>
            <Field label="Date of Birth" required error={errors.dependents?.[index]?.dateOfBirth?.message}>
              <input
                type="date"
                {...register(`dependents.${index}.dateOfBirth`, {
                  required: 'Date of birth is required',
                  validate: noFutureDate,
                })}
                className={inputClass}
              />
            </Field>
            <Field label="Gender" required error={errors.dependents?.[index]?.gender?.message}>
              <select {...register(`dependents.${index}.gender`, { required: 'Gender is required' })} className={inputClass}>
                <option value="">Select</option>
                {SEX_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Relationship" required error={errors.dependents?.[index]?.relationship?.message}>
              <select
                {...register(`dependents.${index}.relationship`, { required: 'Relationship is required' })}
                className={inputClass}
              >
                <option value="">Select</option>
                {DEPENDENT_RELATIONSHIP_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Mobile Number (if available)"
              error={errors.dependents?.[index]?.mobileNumber?.message}
              hint={MOBILE_NUMBER_HINT}
            >
              <input
                {...register(`dependents.${index}.mobileNumber`, { validate: validateMobileNumber })}
                placeholder="07XXXXXXXX"
                inputMode="numeric"
                maxLength={10}
                className={inputClass}
              />
            </Field>
            {dependentValues?.[index]?.relationship === 'child' && (
              <Field label="School" error={errors.dependents?.[index]?.school?.message}>
                <input {...register(`dependents.${index}.school`, { validate: noEmoji })} className={inputClass} />
              </Field>
            )}
          </div>
        </RepeatableCard>
      ))}
    </div>
  );
}
