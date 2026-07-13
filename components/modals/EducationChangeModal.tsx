'use client';

import { DefaultValues, SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import { useSubmitProfileChangeMutation } from '@/hooks/mutations/use-submit-profile-change-mutation';
import { QUALIFICATION_LEVEL_OPTIONS, type EmployeeEducation, type ProfileChangeItem } from '@/types/profile';

const educationSchema = z.object({
  qualificationLevel: z.enum([
    'certificate',
    'advanced_certificate',
    'diploma',
    'advanced_diploma',
    'degree',
    'postgraduate_diploma',
    'masters',
    'mphil',
    'phd',
  ]),
  qualificationTitle: z.string().min(1, 'Qualification title is required'),
  awardingInstitution: z.string().min(1, 'Awarding institution is required'),
  dateAwarded: z.string().optional(),
  remarks: z.string().optional(),
});

type EducationFormValues = z.infer<typeof educationSchema>;

interface EducationChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Omit for "add new" - pass the existing record for "edit". */
  initialData?: EmployeeEducation | null;
}

export default function EducationChangeModal({ isOpen, onClose, initialData }: EducationChangeModalProps) {
  const toast = useToast();
  const submitChange = useSubmitProfileChangeMutation();
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EducationFormValues>({
    resolver: zodResolver(educationSchema) as any,
    defaultValues: (initialData
      ? {
          qualificationLevel: initialData.qualificationLevel,
          qualificationTitle: initialData.qualificationTitle,
          awardingInstitution: initialData.awardingInstitution,
          dateAwarded: initialData.dateAwarded ?? '',
          remarks: initialData.remarks ?? '',
        }
      : {
          qualificationLevel: 'degree',
          qualificationTitle: '',
          awardingInstitution: '',
          dateAwarded: '',
          remarks: '',
        }) as DefaultValues<EducationFormValues>,
  });

  const handleFormSubmit: SubmitHandler<EducationFormValues> = async (data) => {
    const after = {
      qualificationLevel: data.qualificationLevel,
      qualificationTitle: data.qualificationTitle,
      awardingInstitution: data.awardingInstitution,
      dateAwarded: data.dateAwarded || null,
      remarks: data.remarks || null,
    };

    const item: ProfileChangeItem = isEdit
      ? {
          entityType: 'education',
          operation: 'update',
          recordId: initialData!.id,
          before: {
            qualificationLevel: initialData!.qualificationLevel,
            qualificationTitle: initialData!.qualificationTitle,
            awardingInstitution: initialData!.awardingInstitution,
            dateAwarded: initialData!.dateAwarded,
            remarks: initialData!.remarks,
          },
          after,
        }
      : {
          entityType: 'education',
          operation: 'create',
          recordId: null,
          after,
        };

    try {
      await submitChange.mutateAsync({ changes: [item] });
      toast.success(
        isEdit ? 'Change request submitted' : 'Change request submitted',
        'Your education record change is now pending HR approval.'
      );
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
      title={isEdit ? 'Edit Education Record' : 'Add Education Record'}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="education-change-form" isLoading={isSubmitting}>
            Submit for Approval
          </Button>
        </>
      }
    >
      <form id="education-change-form" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <p className="text-xs text-[var(--gray-400)] font-medium bg-[var(--gray-25)] border border-[var(--gray-100)] rounded-xl p-3">
          This will be sent to HR for approval before appearing on your profile.
        </p>

        <div>
          <label className="block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">
            Qualification Level
          </label>
          <select
            {...register('qualificationLevel')}
            className="block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          >
            {QUALIFICATION_LEVEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">
            Qualification Title
          </label>
          <input
            {...register('qualificationTitle')}
            placeholder="e.g. BSc (Hons) Computer Science"
            className="block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
          {errors.qualificationTitle && (
            <p className="mt-1 text-xs text-red-500">{errors.qualificationTitle.message}</p>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">
            Awarding Institution
          </label>
          <input
            {...register('awardingInstitution')}
            placeholder="e.g. University of Colombo"
            className="block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
          {errors.awardingInstitution && (
            <p className="mt-1 text-xs text-red-500">{errors.awardingInstitution.message}</p>
          )}
        </div>

        <div>
          <label className="block text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">
            Date Awarded
          </label>
          <input
            type="date"
            {...register('dateAwarded')}
            className="block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
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
