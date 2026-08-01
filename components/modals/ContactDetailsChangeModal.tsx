'use client';

import { DefaultValues, SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import { useSubmitProfileChangeMutation } from '@/hooks/mutations/use-submit-profile-change-mutation';
import { BLOOD_TYPE_OPTIONS, type BloodType, type EmployeePii, type ProfileChangeItem } from '@/types/profile';

const contactDetailsSchema = z.object({
  bloodType: z.string().optional(),
});

type ContactDetailsFormValues = z.infer<typeof contactDetailsSchema>;

interface ContactDetailsChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  pii: EmployeePii | null | undefined;
}

// Emergency contacts moved to the multi-record Emergency Contacts section
// (Tab D of the profile wizard) since tbl_employee_pii can only hold one
// contact - this modal now only covers Blood Type.
export default function ContactDetailsChangeModal({ isOpen, onClose, pii }: ContactDetailsChangeModalProps) {
  const toast = useToast();
  const submitChange = useSubmitProfileChangeMutation();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ContactDetailsFormValues>({
    resolver: zodResolver(contactDetailsSchema) as any,
    defaultValues: {
      bloodType: pii?.bloodType ?? '',
    } as DefaultValues<ContactDetailsFormValues>,
  });

  const handleFormSubmit: SubmitHandler<ContactDetailsFormValues> = async (data) => {
    const changes: ProfileChangeItem[] = [];

    const currentBloodType = pii?.bloodType ?? '';
    if (data.bloodType && data.bloodType !== currentBloodType) {
      changes.push({
        entityType: 'employee_pii_field',
        field: 'blood_type',
        operation: 'update',
        before: (pii?.bloodType as BloodType) ?? null,
        after: data.bloodType as BloodType,
      });
    }

    if (changes.length === 0) {
      toast.info('No changes detected', 'Update at least one field before submitting.');
      return;
    }

    try {
      await submitChange.mutateAsync({ changes });
      toast.success('Change request submitted', 'HR will review your requested changes shortly.');
      onClose();
    } catch {
      toast.error('Failed to submit change request', 'Please try again.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Request Blood Type Change"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="contact-details-change-form" isLoading={isSubmitting}>
            Submit for Approval
          </Button>
        </>
      }
    >
      <form id="contact-details-change-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
        <p className="text-xs text-[var(--gray-400)] font-medium bg-[var(--gray-25)] border border-[var(--gray-100)] rounded-xl p-3">
          This field requires HR approval. Your current value stays unchanged until an HR Manager approves this
          request. To add or edit emergency contacts, use Edit Profile.
        </p>

        <div>
          <label className="block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">
            Blood Type
          </label>
          <select
            {...register('bloodType')}
            className="block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            <option value="">Not set</option>
            {BLOOD_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </form>
    </Modal>
  );
}
