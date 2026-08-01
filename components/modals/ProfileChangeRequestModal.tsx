'use client';

import { DefaultValues, SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import { useSubmitProfileChangeMutation } from '@/hooks/mutations/use-submit-profile-change-mutation';
import type { User } from '@/types';
import { TITLE_OPTIONS, type EmployeePii, type ProfileChangeItem } from '@/types/profile';

const requestSchema = z.object({
  title: z.string().optional(),
  contactNumber: z.string().min(1, 'Telephone number is required'),
  addressLine1: z.string().min(1, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  district: z.string().min(1, 'District is required'),
  bankName: z.string().optional(),
  accountHolderName: z.string().optional(),
  accountNumber: z.string().optional(),
  bankBranch: z.string().optional(),
  bankBranchCode: z.string().optional(),
  swiftCode: z.string().optional(),
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
      title: user?.title ?? '',
      contactNumber: user?.contact_number ?? '',
      addressLine1: pii?.addressLine1 ?? '',
      addressLine2: pii?.addressLine2 ?? '',
      city: pii?.city ?? '',
      district: pii?.district ?? '',
      bankName: user?.bank_name ?? '',
      accountHolderName: user?.account_holder_name ?? '',
      accountNumber: user?.account_number ?? '',
      bankBranch: user?.bank_branch ?? '',
      bankBranchCode: user?.bank_branch_code ?? '',
      swiftCode: user?.swift_code ?? '',
    } as DefaultValues<RequestFormValues>,
  });

  const handleFormSubmit: SubmitHandler<RequestFormValues> = async (data) => {
    const changes: ProfileChangeItem[] = [];

    const currentTitle = user?.title ?? '';
    if ((data.title ?? '') !== currentTitle) {
      changes.push({
        entityType: 'user_field',
        field: 'title',
        operation: 'update',
        before: user?.title ?? null,
        after: data.title || null,
      });
    }

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

    const addressBefore = pii
      ? {
          addressLine1: pii.addressLine1 ?? '',
          addressLine2: pii.addressLine2 ?? null,
          city: pii.city ?? '',
          district: pii.district ?? '',
        }
      : null;
    const addressAfter = {
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2 || null,
      city: data.city,
      district: data.district,
    };
    if (JSON.stringify(addressBefore) !== JSON.stringify(addressAfter)) {
      changes.push({
        entityType: 'employee_pii_field',
        field: 'address',
        operation: 'update',
        before: addressBefore,
        after: addressAfter,
      });
    }

    const bankBefore = {
      bankName: user?.bank_name ?? null,
      accountHolderName: user?.account_holder_name ?? null,
      accountNumber: user?.account_number ?? null,
      bankBranch: user?.bank_branch ?? null,
      bankBranchCode: user?.bank_branch_code ?? null,
      swiftCode: user?.swift_code ?? null,
    };
    const bankAfter = {
      bankName: data.bankName || null,
      accountHolderName: data.accountHolderName || null,
      accountNumber: data.accountNumber || null,
      bankBranch: data.bankBranch || null,
      bankBranchCode: data.bankBranchCode || null,
      swiftCode: data.swiftCode || null,
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
              Title
            </label>
            <select
              {...register('title')}
              className="block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="">Not set</option>
              {TITLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
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
        </div>

        <div className="space-y-3">
          <label className="block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider">
            Address
          </label>
          <div>
            <input
              {...register('addressLine1')}
              placeholder="Address Line 1"
              className="block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            {errors.addressLine1 && <p className="mt-1 text-xs text-red-500">{errors.addressLine1.message}</p>}
          </div>
          <input
            {...register('addressLine2')}
            placeholder="Address Line 2 (optional)"
            className="block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <input
                {...register('city')}
                placeholder="City"
                className="block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
              {errors.city && <p className="mt-1 text-xs text-red-500">{errors.city.message}</p>}
            </div>
            <div>
              <input
                {...register('district')}
                placeholder="District"
                className="block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
              {errors.district && <p className="mt-1 text-xs text-red-500">{errors.district.message}</p>}
            </div>
          </div>
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
            <div>
              <label className="block text-[10px] font-semibold text-[var(--gray-400)] mb-1.5">Branch Code</label>
              <input
                {...register('bankBranchCode')}
                className="block w-full px-3.5 py-2 border border-[var(--gray-100)] rounded-xl text-xs font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-[var(--gray-400)] mb-1.5">Swift Code</label>
              <input
                {...register('swiftCode')}
                className="block w-full px-3.5 py-2 border border-[var(--gray-100)] rounded-xl text-xs font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none"
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
