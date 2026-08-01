'use client';

import { DefaultValues, SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import { useSubmitProfileChangeMutation } from '@/hooks/mutations/use-submit-profile-change-mutation';
import { EMPLOYMENT_TYPE_OPTIONS, type EmployeeWorkHistory, type ProfileChangeItem } from '@/types/profile';

const workHistorySchema = z
  .object({
    organization: z.string().min(1, 'Organization is required'),
    positionHeld: z.string().min(1, 'Position held is required'),
    employmentType: z.enum(['regular', 'intern', 'trainee']),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().optional(),
    isCurrent: z.boolean(),
    remarks: z.string().optional(),
  })
  .refine((data) => data.isCurrent || !!data.endDate, {
    message: 'End date is required unless this is your current role',
    path: ['endDate'],
  });

type WorkHistoryFormValues = z.infer<typeof workHistorySchema>;

interface WorkHistoryChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: EmployeeWorkHistory | null;
}

export default function WorkHistoryChangeModal({ isOpen, onClose, initialData }: WorkHistoryChangeModalProps) {
  const toast = useToast();
  const submitChange = useSubmitProfileChangeMutation();
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WorkHistoryFormValues>({
    resolver: zodResolver(workHistorySchema) as any,
    defaultValues: (initialData
      ? {
          organization: initialData.organization,
          positionHeld: initialData.positionHeld,
          employmentType: initialData.employmentType,
          startDate: initialData.startDate,
          endDate: initialData.endDate ?? '',
          isCurrent: !initialData.endDate,
          remarks: initialData.remarks ?? '',
        }
      : {
          organization: '',
          positionHeld: '',
          employmentType: 'regular',
          startDate: '',
          endDate: '',
          isCurrent: false,
          remarks: '',
        }) as DefaultValues<WorkHistoryFormValues>,
  });

  const isCurrent = watch('isCurrent');

  const handleFormSubmit: SubmitHandler<WorkHistoryFormValues> = async (data) => {
    const after = {
      organization: data.organization,
      positionHeld: data.positionHeld,
      employmentType: data.employmentType,
      startDate: data.startDate,
      endDate: data.isCurrent ? null : data.endDate || null,
      remarks: data.remarks || null,
    };

    const item: ProfileChangeItem = isEdit
      ? {
          entityType: 'work_history',
          operation: 'update',
          recordId: initialData!.id,
          before: {
            organization: initialData!.organization,
            positionHeld: initialData!.positionHeld,
            employmentType: initialData!.employmentType,
            startDate: initialData!.startDate,
            endDate: initialData!.endDate,
            remarks: initialData!.remarks,
          },
          after,
        }
      : {
          entityType: 'work_history',
          operation: 'create',
          recordId: null,
          after,
        };

    try {
      await submitChange.mutateAsync({ changes: [item] });
      toast.success('Change request submitted', 'Your work history change is now pending HR approval.');
      reset();
      onClose();
    } catch {
      toast.error('Failed to submit change request', 'Please try again.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Work History Entry' : 'Add Work History Entry'}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="work-history-change-form" isLoading={isSubmitting}>
            Submit for Approval
          </Button>
        </>
      }
    >
      <form id="work-history-change-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <p className="text-xs text-[var(--gray-400)] font-medium bg-[var(--gray-25)] border border-[var(--gray-100)] rounded-xl p-3">
          This will be sent to HR for approval before appearing on your profile.
        </p>

        <div>
          <label className="block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">
            Organization
          </label>
          <input
            {...register('organization')}
            className="block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
          {errors.organization && <p className="mt-1 text-xs text-red-500">{errors.organization.message}</p>}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">
            Position Held
          </label>
          <input
            {...register('positionHeld')}
            className="block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
          {errors.positionHeld && <p className="mt-1 text-xs text-red-500">{errors.positionHeld.message}</p>}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">
            Employment Type
          </label>
          <select
            {...register('employmentType')}
            className="block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            {EMPLOYMENT_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">
              Start Date
            </label>
            <input
              type="date"
              {...register('startDate')}
              className="block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
            {errors.startDate && <p className="mt-1 text-xs text-red-500">{errors.startDate.message}</p>}
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">
              End Date
            </label>
            <input
              type="date"
              disabled={isCurrent}
              {...register('endDate')}
              className="block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:bg-[var(--gray-25)] disabled:text-[var(--gray-400)]"
            />
            {errors.endDate && <p className="mt-1 text-xs text-red-500">{errors.endDate.message}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" {...register('isCurrent')} id="isCurrent" className="h-4 w-4 rounded text-[var(--primary)]" />
          <label htmlFor="isCurrent" className="text-xs font-semibold text-[var(--foreground)]">
            I currently work here
          </label>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">
            Remarks
          </label>
          <textarea
            {...register('remarks')}
            rows={2}
            className="block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>
      </form>
    </Modal>
  );
}
