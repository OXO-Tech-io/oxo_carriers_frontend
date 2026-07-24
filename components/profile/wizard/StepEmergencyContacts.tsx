'use client';

import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { BLOOD_TYPE_OPTIONS } from '@/types/profile';
import { Field, RepeatableCard, inputClass } from './shared';
import type { WizardFormValues } from './wizardTypes';

interface StepProps {
  form: UseFormReturn<WizardFormValues>;
}

export default function StepEmergencyContacts({ form }: StepProps) {
  const {
    register,
    control,
    formState: { errors },
  } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'emergencyContacts' });

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--gray-400)] font-medium">
            Add one or more emergency contact persons.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ id: null, name: '', relationship: '', contactNumber: '' })}
          >
            Add Contact
          </Button>
        </div>
        {fields.length === 0 && <p className="text-xs text-[var(--gray-400)] font-medium">No emergency contacts added yet.</p>}
        {fields.map((f, index) => (
          <RepeatableCard key={f.id} title={`Contact ${index + 1}`} onRemove={() => remove(index)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Name of Contact Person" error={errors.emergencyContacts?.[index]?.name?.message}>
                <input {...register(`emergencyContacts.${index}.name`, { required: 'Name is required' })} className={inputClass} />
              </Field>
              <Field label="Relationship" error={errors.emergencyContacts?.[index]?.relationship?.message}>
                <input
                  {...register(`emergencyContacts.${index}.relationship`, { required: 'Relationship is required' })}
                  className={inputClass}
                />
              </Field>
              <Field
                label="Contact Details (Mobile No. / Landline No.)"
                error={errors.emergencyContacts?.[index]?.contactNumber?.message}
              >
                <input
                  {...register(`emergencyContacts.${index}.contactNumber`, { required: 'Contact number is required' })}
                  className={inputClass}
                />
              </Field>
            </div>
          </RepeatableCard>
        ))}
      </div>

      <Field label="Blood Group">
        <select {...register('bloodType')} className={inputClass}>
          <option value="">Not set</option>
          {BLOOD_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </Field>
    </div>
  );
}
