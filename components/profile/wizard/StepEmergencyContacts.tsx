'use client';

import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { BLOOD_TYPE_OPTIONS } from '@/types/profile';
import { Field, RepeatableCard, SectionTitle, inputClass } from './shared';
import type { WizardFormValues } from './wizardTypes';
import { noEmoji, validatePhoneNumber, MOBILE_NUMBER_HINT } from '@/lib/validation/textValidation';

interface StepProps {
  form: UseFormReturn<WizardFormValues>;
}

export default function StepEmergencyContacts({ form }: StepProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'emergencyContacts',
    // OCD-474: at least one emergency contact is required before "Next"/submit.
    rules: {
      validate: (value) =>
        (value && value.length > 0) || 'At least one emergency contact must be added before proceeding.',
    },
  });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <SectionTitle>
            Emergency Contacts <span className="text-red-500">*</span>
          </SectionTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ id: null, name: '', relationship: '', contactNumber: '' })}
          >
            Add Contact
          </Button>
        </div>
        {errors.emergencyContacts?.root?.message && (
          <p className="text-xs text-red-500 font-medium">{errors.emergencyContacts.root.message}</p>
        )}
        {fields.length === 0 && !errors.emergencyContacts?.root?.message && (
          <p className="text-xs text-[var(--gray-400)] font-medium">No emergency contacts added yet.</p>
        )}
        {fields.map((f, index) => (
          <RepeatableCard key={f.id} title={`Contact ${index + 1}`} onRemove={() => remove(index)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Name of Contact Person" required error={errors.emergencyContacts?.[index]?.name?.message}>
                <input
                  {...register(`emergencyContacts.${index}.name`, { required: 'Name is required', validate: noEmoji })}
                  className={inputClass}
                />
              </Field>
              <Field label="Relationship" required error={errors.emergencyContacts?.[index]?.relationship?.message}>
                <input
                  {...register(`emergencyContacts.${index}.relationship`, {
                    required: 'Relationship is required',
                    validate: noEmoji,
                  })}
                  className={inputClass}
                />
              </Field>
              <Field
                label="Contact Details (Mobile No. / Landline No.)"
                required
                error={errors.emergencyContacts?.[index]?.contactNumber?.message}
                hint={MOBILE_NUMBER_HINT}
              >
                <input
                  {...register(`emergencyContacts.${index}.contactNumber`, {
                    required: 'Contact number is required',
                    validate: validatePhoneNumber,
                  })}
                  placeholder="07XXXXXXXX"
                  inputMode="numeric"
                  maxLength={10}
                  className={inputClass}
                />
              </Field>
            </div>
          </RepeatableCard>
        ))}
      </div>

      <Field label="Blood Group" required error={errors.bloodType?.message}>
        <select {...register('bloodType', { required: 'Blood Group is required' })} className={inputClass}>
          <option value="">Select</option>
          {BLOOD_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Medical Conditions (any conditions to be aware of)" error={errors.medicalConditions?.message}>
        <textarea {...register('medicalConditions', { validate: noEmoji })} rows={3} className={inputClass} />
      </Field>
      <Field label="Allergies (any known allergies)" error={errors.allergies?.message}>
        <textarea {...register('allergies', { validate: noEmoji })} rows={3} className={inputClass} />
      </Field>
    </div>
  );
}
