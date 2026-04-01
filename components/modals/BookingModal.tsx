'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Facility } from '@/types';
import { format } from 'date-fns';

const bookingSchema = z.object({
  facility_id: z.number(),
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
  purpose: z.string().min(1, 'Purpose is required'),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BookingFormValues) => Promise<void>;
  facility: Facility | null;
}

export default function BookingModal({
  isOpen,
  onClose,
  onSubmit,
  facility,
}: BookingModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema) as any,
    defaultValues: {
      facility_id: facility?.id,
      start_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      end_time: format(new Date(new Date().getTime() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
    },
  });

  const handleFormSubmit = async (data: BookingFormValues) => {
    try {
      await onSubmit(data);
      reset();
    } catch (error) {
      console.error('Failed to book facility:', error);
    }
  };

  if (!isOpen || !facility) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
          <form onSubmit={handleSubmit(handleFormSubmit as any)}>
            <div className="bg-white px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-2xl font-bold text-[#101828]">Book {facility.name}</h3>
                <button type="button" onClick={onClose} className="text-[#98A2B3] hover:text-[#344054]">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <input type="hidden" {...register('facility_id', { valueAsNumber: true })} />
                
                <div>
                  <label className="block text-sm font-medium text-[#344054] mb-1">Purpose / Note</label>
                  <input
                    {...register('purpose')}
                    placeholder="e.g. Project Meeting, Client Call"
                    className="block w-full px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:ring-2 focus:ring-[#465FFF]"
                  />
                  {errors.purpose && <p className="mt-1 text-xs text-red-500">{errors.purpose.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-1">Start Time</label>
                    <input
                      type="datetime-local"
                      {...register('start_time')}
                      className="block w-full px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:ring-2 focus:ring-[#465FFF]"
                    />
                    {errors.start_time && <p className="mt-1 text-xs text-red-500">{errors.start_time.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-1">End Time</label>
                    <input
                      type="datetime-local"
                      {...register('end_time')}
                      className="block w-full px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:ring-2 focus:ring-[#465FFF]"
                    />
                    {errors.end_time && <p className="mt-1 text-xs text-red-500">{errors.end_time.message}</p>}
                  </div>
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
                  {isSubmitting ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
