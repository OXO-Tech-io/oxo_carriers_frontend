'use client';

import { UseFormReturn } from 'react-hook-form';
import { Field, inputClass } from './shared';
import type { WizardFormValues } from './wizardTypes';
import { noEmoji, noFutureDate, validateLinkedInUrl } from '@/lib/validation/textValidation';

interface StepProps {
  form: UseFormReturn<WizardFormValues>;
}

export default function StepWelfare({ form }: StepProps) {
  const {
    register,
    formState: { errors },
  } = form;

  return (
    <div className="space-y-4">
      <Field label="Your Wedding Anniversary Date (if applicable)" error={errors.weddingAnniversaryDate?.message}>
        <input type="date" {...register('weddingAnniversaryDate', { validate: noFutureDate })} className={inputClass} />
      </Field>
      <Field label="Your Hobbies / Pastime Activities" error={errors.hobbies?.message}>
        <textarea {...register('hobbies', { validate: noEmoji })} rows={3} className={inputClass} />
      </Field>
      <Field label="Any Community Activities You Are Involved In" error={errors.communityActivities?.message}>
        <textarea {...register('communityActivities', { validate: noEmoji })} rows={3} className={inputClass} />
      </Field>
      <Field label="Any Professional Bodies That You Have Membership In" error={errors.professionalMemberships?.message}>
        <textarea {...register('professionalMemberships', { validate: noEmoji })} rows={3} className={inputClass} />
      </Field>
      <Field
        label="LinkedIn Profile"
        error={errors.linkedinProfile?.message}
        hint="e.g. https://www.linkedin.com/in/john-doe"
      >
        <input
          type="url"
          {...register('linkedinProfile', { validate: validateLinkedInUrl })}
          placeholder="https://www.linkedin.com/in/..."
          className={inputClass}
        />
      </Field>
      <Field label="Additional Notes" error={errors.additionalNotes?.message}>
        <textarea {...register('additionalNotes', { validate: noEmoji })} rows={3} className={inputClass} />
      </Field>
    </div>
  );
}
