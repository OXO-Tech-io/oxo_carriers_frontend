'use client';

import { DefaultValues, SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import { useSubmitProfileChangeMutation } from '@/hooks/mutations/use-submit-profile-change-mutation';
import type { ProfileChangeItem } from '@/types/profile';

const degreeDateSchema = z.object({
  undergraduateDegreeCompletionDate: z.string().optional(),
});

type DegreeDateFormValues = z.infer<typeof degreeDateSchema>;

interface DegreeDateChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDate: string | null | undefined;
}

export default function DegreeDateChangeModal({ isOpen, onClose, currentDate }: DegreeDateChangeModalProps) {
  const toast = useToast();
  const submitChange = useSubmitProfileChangeMutation();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<DegreeDateFormValues>({
    resolver: zodResolver(degreeDateSchema) as any,
    defaultValues: {
      undergraduateDegreeCompletionDate: currentDate ?? '',
    } as DefaultValues<DegreeDateFormValues>,
  });

  const handleFormSubmit: SubmitHandler<DegreeDateFormValues> = async (data) => {
    const current = currentDate ?? '';
    if ((data.undergraduateDegreeCompletionDate ?? '') === current) {
      toast.info('No changes detected', 'Update the date before submitting.');
      return;
    }

    const item: ProfileChangeItem = {
      entityType: 'user_field',
      field: 'undergraduateDegreeCompletionDate',
      operation: 'update',
      before: currentDate ?? null,
      after: data.undergraduateDegreeCompletionDate || null,
    };

    try {
      await submitChange.mutateAsync({ changes: [item] });
      toast.success('Change request submitted', 'HR will review your requested change shortly.');
      onClose();
    } catch {
      toast.error('Failed to submit change request', 'Please try again.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Update Undergraduate Degree Completion Date"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="degree-date-change-form" isLoading={isSubmitting}>
            Submit for Approval
          </Button>
        </>
      }
    >
      <form id="degree-date-change-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <p className="text-xs text-[var(--gray-400)] font-medium bg-[var(--gray-25)] border border-[var(--gray-100)] rounded-xl p-3">
          This is used to calculate your post-degree experience and requires HR approval.
        </p>
        <div>
          <label className="block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">
            Undergraduate Degree Completion Date
          </label>
          <input
            type="date"
            {...register('undergraduateDegreeCompletionDate')}
            className="block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
      </form>
    </Modal>
  );
}
