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
  emergencyContactName: z.string().min(1, 'Emergency contact name is required'),
  emergencyContactPhone: z.string().min(1, 'Emergency contact phone is required'),
  emergencyContactRelationship: z.string().optional(),
  bloodType: z.string().optional(),
});

type ContactDetailsFormValues = z.infer<typeof contactDetailsSchema>;

interface ContactDetailsChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  pii: EmployeePii | null | undefined;
}

export default function ContactDetailsChangeModal({ isOpen, onClose, pii }: ContactDetailsChangeModalProps) {
  const toast = useToast();
  const submitChange = useSubmitProfileChangeMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ContactDetailsFormValues>({
    resolver: zodResolver(contactDetailsSchema) as any,
    defaultValues: {
      emergencyContactName: pii?.emergencyContactName ?? '',
      emergencyContactPhone: pii?.emergencyContactPhone ?? '',
      emergencyContactRelationship: pii?.emergencyContactRelationship ?? '',
      bloodType: pii?.bloodType ?? '',
    } as DefaultValues<ContactDetailsFormValues>,
  });

  const handleFormSubmit: SubmitHandler<ContactDetailsFormValues> = async (data) => {
    const changes: ProfileChangeItem[] = [];

    const contactBefore = pii
      ? {
          emergencyContactName: pii.emergencyContactName ?? '',
          emergencyContactPhone: pii.emergencyContactPhone ?? '',
          emergencyContactRelationship: pii.emergencyContactRelationship ?? null,
        }
      : null;
    const contactAfter = {
      emergencyContactName: data.emergencyContactName,
      emergencyContactPhone: data.emergencyContactPhone,
      emergencyContactRelationship: data.emergencyContactRelationship || null,
    };
    if (JSON.stringify(contactBefore) !== JSON.stringify(contactAfter)) {
      changes.push({
        entityType: 'employee_pii_field',
        field: 'emergency_contact',
        operation: 'update',
        before: contactBefore,
        after: contactAfter,
      });
    }

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
      title="Request Contact Detail Changes"
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
          These fields require HR approval. Your current values stay unchanged until an HR Manager approves this request.
        </p>

        <div className="space-y-4">
          <p className="text-[10px] font-bold text-[var(--gray-500)] uppercase tracking-wider">Emergency Contact</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">
                Name
              </label>
              <input
                {...register('emergencyContactName')}
                className="block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
              {errors.emergencyContactName && (
                <p className="mt-1 text-xs text-red-500">{errors.emergencyContactName.message}</p>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">
                Phone
              </label>
              <input
                {...register('emergencyContactPhone')}
                className="block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
              {errors.emergencyContactPhone && (
                <p className="mt-1 text-xs text-red-500">{errors.emergencyContactPhone.message}</p>
              )}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">
              Relationship
            </label>
            <input
              {...register('emergencyContactRelationship')}
              placeholder="e.g. Spouse, Parent, Sibling"
              className="block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
        </div>

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
