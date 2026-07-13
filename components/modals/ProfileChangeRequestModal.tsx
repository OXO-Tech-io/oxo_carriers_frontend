'use client';

import { DefaultValues, SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import { useSubmitProfileChangeMutation } from '@/hooks/mutations/use-submit-profile-change-mutation';
import type { User } from '@/types';
import type { EmployeePii, ProfileChangeItem } from '@/types/profile';

const requestSchema = z.object({
  contactNumber: z.string().min(1, 'Telephone number is required'),
  address: z.string().min(1, 'Address is required'),
  bankName: z.string().optional(),
  accountHolderName: z.string().optional(),
  accountNumber: z.string().optional(),
  bankBranch: z.string().optional(),
  undergraduateDegreeCompletionDate: z.string().optional(),
});

type RequestFormValues = z.infer<typeof requestSchema>;

interface ProfileChangeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null | undefined;
  pii: EmployeePii | null | undefined;
}

export default function ProfileChangeRequestModal({ isOpen, onClose, user, pii }: ProfileChangeRequestModalProps) {
  const toast = useToast();
  const submitChange = useSubmitProfileChangeMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema) as any,
    defaultValues: {
      contactNumber: user?.contact_number ?? '',
      address: pii?.address ?? '',
      bankName: user?.bank_name ?? '',
      accountHolderName: user?.account_holder_name ?? '',
      accountNumber: user?.account_number ?? '',
      bankBranch: user?.bank_branch ?? '',
      undergraduateDegreeCompletionDate: user?.undergraduate_degree_completion_date ?? '',
    } as DefaultValues<RequestFormValues>,
  });

  const handleFormSubmit: SubmitHandler<RequestFormValues> = async (data) => {
    const changes: ProfileChangeItem[] = [];

    const currentContact = user?.contact_number ?? '';
    if (data.contactNumber !== currentContact) {
      changes.push({
        entityType: 'user_field',
        field: 'contactNumber',
        operation: 'update',
        before: user?.contact_number ?? null,
        after: data.contactNumber || null,
      });
    }

    const currentAddress = pii?.address ?? '';
    if (data.address !== currentAddress) {
      changes.push({
        entityType: 'employee_pii_field',
        field: 'address',
        operation: 'update',
        before: pii?.address ?? null,
        after: data.address,
      });
    }

    const bankBefore = {
      bankName: user?.bank_name ?? null,
      accountHolderName: user?.account_holder_name ?? null,
      accountNumber: user?.account_number ?? null,
      bankBranch: user?.bank_branch ?? null,
    };
    const bankAfter = {
      bankName: data.bankName || null,
      accountHolderName: data.accountHolderName || null,
      accountNumber: data.accountNumber || null,
      bankBranch: data.bankBranch || null,
    };
    if (JSON.stringify(bankBefore) !== JSON.stringify(bankAfter)) {
      changes.push({
        entityType: 'user_field',
        field: 'bank_account',
        operation: 'update',
        before: bankBefore,
        after: bankAfter,
      });
    }

    const currentDegreeDate = user?.undergraduate_degree_completion_date ?? '';
    if (data.undergraduateDegreeCompletionDate !== currentDegreeDate) {
      changes.push({
        entityType: 'user_field',
        field: 'undergraduateDegreeCompletionDate',
        operation: 'update',
        before: user?.undergraduate_degree_completion_date ?? null,
        after: data.undergraduateDegreeCompletionDate || null,
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
      title="Request Profile Changes"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="profile-change-request-form" isLoading={isSubmitting}>
            Submit for Approval
          </Button>
        </>
      }
    >
      <form id="profile-change-request-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
        <p className="text-xs text-[var(--gray-400)] font-medium bg-[var(--gray-25)] border border-[var(--gray-100)] rounded-xl p-3">
          These fields require HR approval. Your current profile values stay unchanged until an HR Manager approves this request.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">
              Telephone Number
            </label>
            <input
              {...register('contactNumber')}
              className="block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            {errors.contactNumber && <p className="mt-1 text-xs text-red-500">{errors.contactNumber.message}</p>}
          </div>
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
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">
            Address
          </label>
          <textarea
            {...register('address')}
            rows={2}
            className="block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
          {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address.message}</p>}
        </div>

        <div className="bg-[var(--gray-25)] p-4 rounded-2xl border border-[var(--gray-50)] space-y-4">
          <p className="text-[10px] font-bold text-[var(--gray-500)] uppercase tracking-wider">Bank Account Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-semibold text-[var(--gray-400)] mb-1.5">Bank Name</label>
              <input
                {...register('bankName')}
                className="block w-full px-3.5 py-2 border border-[var(--gray-100)] rounded-xl text-xs font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--gray-400)] mb-1.5">Account Holder Name</label>
              <input
                {...register('accountHolderName')}
                className="block w-full px-3.5 py-2 border border-[var(--gray-100)] rounded-xl text-xs font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--gray-400)] mb-1.5">Account Number</label>
              <input
                {...register('accountNumber')}
                className="block w-full px-3.5 py-2 border border-[var(--gray-100)] rounded-xl text-xs font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--gray-400)] mb-1.5">Bank Branch</label>
              <input
                {...register('bankBranch')}
                className="block w-full px-3.5 py-2 border border-[var(--gray-100)] rounded-xl text-xs font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
