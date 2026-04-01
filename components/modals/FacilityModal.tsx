'use client';

import { DefaultValues, SubmitHandler, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Facility, FacilityType } from '@/types';

const facilitySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.nativeEnum(FacilityType),
  description: z.string().optional(),
  facilities: z.string().optional(),
  capacity: z.number().min(1, 'Capacity must be at least 1'),
  is_active: z.boolean(),
});

type FacilityFormValues = z.infer<typeof facilitySchema>;

interface FacilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FacilityFormValues) => Promise<void>;
  initialData?: Facility | null;
}

export default function FacilityModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: FacilityModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FacilityFormValues>({
    resolver: zodResolver(facilitySchema) as any,
    defaultValues: (initialData
      ? {
          name: initialData.name,
          type: initialData.type,
          description: initialData.description || '',
          facilities: initialData.facilities || '',
          capacity: initialData.capacity || 1,
          is_active: initialData.is_active,
        }
      : {
          name: '',
          type: FacilityType.WORKSTATION,
          description: '',
          facilities: '',
          capacity: 1,
          is_active: true,
        }) as DefaultValues<FacilityFormValues>,
  });

  const handleFormSubmit: SubmitHandler<FacilityFormValues> = async (data) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      console.error('Failed to submit facility:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <form onSubmit={handleSubmit(handleFormSubmit as any)}>
            <div className="bg-white px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-[#101828]">
                  {initialData ? 'Edit Facility' : 'Create Facility'}
                </h3>
                <button type="button" onClick={onClose} className="text-[#98A2B3] hover:text-[#344054]">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#344054] mb-1">Name</label>
                  <input
                    {...register('name')}
                    className="block w-full px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:ring-2 focus:ring-[#465FFF]"
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#344054] mb-1">Type</label>
                  <select
                    {...register('type')}
                    className="block w-full px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:ring-2 focus:ring-[#465FFF]"
                  >
                    <option value={FacilityType.WORKSTATION}>Workstation</option>
                    <option value={FacilityType.BOARD_ROOM}>Board Room</option>
                    <option value={FacilityType.MEETING_ROOM}>Meeting Room</option>
                    <option value={FacilityType.ACCOMMODATION}>Accommodation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#344054] mb-1">Capacity</label>
                  <input
                    type="number"
                    {...register('capacity', { valueAsNumber: true })}
                    className="block w-full px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:ring-2 focus:ring-[#465FFF]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#344054] mb-1">Description</label>
                  <textarea
                    {...register('description')}
                    rows={2}
                    className="block w-full px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:ring-2 focus:ring-[#465FFF]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#344054] mb-1">Available Facilities (comma separated)</label>
                  <textarea
                    {...register('facilities')}
                    rows={2}
                    placeholder="e.g. WiFi, Projector, AC"
                    className="block w-full px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:ring-2 focus:ring-[#465FFF]"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input type="checkbox" {...register('is_active')} id="is_active" className="h-4 w-4 rounded text-[#465FFF]" />
                  <label htmlFor="is_active" className="text-sm text-[#344054]">Active and available for booking</label>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-sm font-semibold text-[#344054] border border-[#D0D5DD] rounded-lg hover:bg-[#F9FAFB]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-[#465FFF] rounded-lg hover:bg-[#3641F5] disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Facility'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
