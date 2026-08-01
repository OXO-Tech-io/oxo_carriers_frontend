'use client';

import { UseFormReturn } from 'react-hook-form';
import { Field, inputClass } from './shared';
import type { WizardFormValues } from './wizardTypes';

interface StepProps {
  form: UseFormReturn<WizardFormValues>;
}

export default function StepWelfare({ form }: StepProps) {
  const { register } = form;

  return (
    <div className="space-y-4">
      <Field label="Your Wedding Anniversary Date (if applicable)">
        <input type="date" {...register('weddingAnniversaryDate')} className={inputClass} />
      </Field>
      <Field label="Your Hobbies / Pastime Activities">
        <textarea {...register('hobbies')} rows={3} className={inputClass} />
      </Field>
      <Field label="Any Community Activities You Are Involved In">
        <textarea {...register('communityActivities')} rows={3} className={inputClass} />
      </Field>
      <Field label="Any Professional Bodies That You Have Membership In">
        <textarea {...register('professionalMemberships')} rows={3} className={inputClass} />
      </Field>
    </div>
  );
}
