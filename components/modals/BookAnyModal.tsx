'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import api from '@/lib/api';
import { Facility, FacilityType } from '@/types';
import { format } from 'date-fns';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';

const step2Schema = z.object({
  start_time: z.string().min(1, 'Start time is required'),
  end_time: z.string().min(1, 'End time is required'),
});

const step3Schema = z.object({
  facility_id: z.number().min(1, 'Select an area'),
  purpose: z.string().min(1, 'Purpose is required'),
});

type Step2Values = z.infer<typeof step2Schema>;
type Step3Values = z.infer<typeof step3Schema>;

const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  [FacilityType.WORKSTATION]: 'Workstation',
  [FacilityType.BOARD_ROOM]: 'Board Room',
  [FacilityType.MEETING_ROOM]: 'Meeting Room',
  [FacilityType.ACCOMMODATION]: 'Accommodation',
};

interface BookAnyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialType?: FacilityType | null;
}

export default function BookAnyModal({
  isOpen,
  onClose,
  onSuccess,
  initialType = null,
}: BookAnyModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedType, setSelectedType] = useState<FacilityType | null>(initialType ?? null);
  const [availableFacilities, setAvailableFacilities] = useState<Facility[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSelectedType(initialType ?? null);
      setStep(1);
      setAvailableFacilities([]);
      setFetchError('');
      setSubmitError('');
    }
  }, [isOpen, initialType]);

  const step2Form = useForm<Step2Values>({
    resolver: zodResolver(step2Schema) as any,
    defaultValues: {
      start_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      end_time: format(new Date(Date.now() + 60 * 60 * 1000), "yyyy-MM-dd'T'HH:mm"),
    },
  });

  const step3Form = useForm<Step3Values>({
    resolver: zodResolver(step3Schema) as any,
    defaultValues: { facility_id: 0, purpose: '' },
  });

  const handleClose = () => {
    setStep(1);
    setSelectedType(initialType ?? null);
    setAvailableFacilities([]);
    setFetchError('');
    step2Form.reset();
    step3Form.reset();
    onClose();
  };

  const handleStep1Next = () => {
    if (!selectedType) return;
    setStep(2);
  };

  const handleStep2Next = async () => {
    const valid = await step2Form.trigger();
    if (!valid || !selectedType) return;
    setFetchError('');
    setLoadingAvailable(true);
    try {
      const { start_time, end_time } = step2Form.getValues();
      const res = await api.get('/facilities/available', {
        params: { type: selectedType, start_time, end_time },
      });
      const list: Facility[] = res.data || [];
      setAvailableFacilities(list);
      if (list.length > 0) {
        step3Form.setValue('facility_id', list[0].id);
      }
      setStep(3);
    } catch (err: any) {
      setFetchError(err.response?.data?.message || 'Failed to load available areas');
    } finally {
      setLoadingAvailable(false);
    }
  };

  const handleConfirmBooking = async () => {
    setSubmitError('');
    const valid = await step3Form.trigger();
    if (!valid) return;
    const { facility_id, purpose } = step3Form.getValues();
    const { start_time, end_time } = step2Form.getValues();
    try {
      await api.post('/facilities/book', {
        facility_id,
        start_time,
        end_time,
        purpose,
      });
      onSuccess();
      handleClose();
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Booking failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
        <div className="relative rounded-2xl bg-white shadow-xl sm:max-w-lg w-full p-6 text-left">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-[#101828]">
              {step === 1 && 'Select type'}
              {step === 2 && 'Select time frame'}
              {step === 3 && 'Confirm & assign area'}
            </h3>
            <button type="button" onClick={handleClose} className="text-[#98A2B3] hover:text-[#344054]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {step === 1 && (
            <>
              <p className="text-sm text-[#667085] mb-4">Choose the type of space you need.</p>
              <div className="grid grid-cols-2 gap-3">
                {(Object.keys(FACILITY_TYPE_LABELS) as FacilityType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedType(type)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedType === type
                        ? 'border-[#465FFF] bg-[#ECF3FF] text-[#465FFF]'
                        : 'border-[#E4E7EC] hover:border-[#98A2B3] text-[#344054]'
                    }`}
                  >
                    <BuildingOfficeIcon className="h-5 w-5 mb-1" />
                    <span className="font-semibold text-sm">{FACILITY_TYPE_LABELS[type]}</span>
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleStep1Next}
                  disabled={!selectedType}
                  className="px-4 py-2.5 bg-[#465FFF] text-white rounded-lg font-semibold hover:bg-[#3641F5] disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-[#667085] mb-4">
                Type: <span className="font-semibold text-[#344054]">{selectedType && FACILITY_TYPE_LABELS[selectedType]}</span>
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#344054] mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    {...step2Form.register('start_time')}
                    className="block w-full px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm focus:ring-2 focus:ring-[#465FFF]"
                  />
                  {step2Form.formState.errors.start_time && (
                    <p className="mt-1 text-xs text-red-500">{step2Form.formState.errors.start_time.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#344054] mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    {...step2Form.register('end_time')}
                    className="block w-full px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm focus:ring-2 focus:ring-[#465FFF]"
                  />
                  {step2Form.formState.errors.end_time && (
                    <p className="mt-1 text-xs text-red-500">{step2Form.formState.errors.end_time.message}</p>
                  )}
                </div>
              </div>
              {fetchError && <p className="mt-2 text-sm text-red-600">{fetchError}</p>}
              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2.5 border border-[#D0D5DD] rounded-lg font-semibold text-[#344054] hover:bg-[#F9FAFB]"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleStep2Next}
                  disabled={loadingAvailable}
                  className="px-4 py-2.5 bg-[#465FFF] text-white rounded-lg font-semibold hover:bg-[#3641F5] disabled:opacity-50"
                >
                  {loadingAvailable ? 'Finding available...' : 'Find available area'}
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <p className="text-sm text-[#667085] mb-4">An available area has been assigned. Add a purpose and confirm.</p>
              {availableFacilities.length === 0 ? (
                <p className="text-amber-600 font-medium">No area available for this time. Try another time or type.</p>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-[#344054] mb-1">Assigned area</label>
                    {availableFacilities.length === 1 ? (
                      <>
                        <input type="hidden" {...step3Form.register('facility_id', { valueAsNumber: true })} />
                        <div className="p-3 bg-[#ECF3FF] rounded-xl text-[#465FFF] font-semibold flex items-center gap-2">
                          <BuildingOfficeIcon className="h-5 w-5" />
                          {availableFacilities[0].name}
                        </div>
                      </>
                    ) : (
                      <select
                        {...step3Form.register('facility_id', { valueAsNumber: true })}
                        className="block w-full px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm focus:ring-2 focus:ring-[#465FFF]"
                      >
                        <option value={0}>Select an area</option>
                        {availableFacilities.map((f) => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-1">Purpose / Note</label>
                    <input
                      {...step3Form.register('purpose')}
                      placeholder="e.g. Project meeting, Client call"
                      className="block w-full px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm focus:ring-2 focus:ring-[#465FFF]"
                    />
                    {step3Form.formState.errors.purpose && (
                      <p className="mt-1 text-xs text-red-500">{step3Form.formState.errors.purpose.message}</p>
                    )}
                  </div>
                  {submitError && (
                    <p className="mt-2 text-sm text-red-600">{submitError}</p>
                  )}
                </>
              )}
              <div className="mt-6 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 border border-[#D0D5DD] rounded-lg font-semibold text-[#344054] hover:bg-[#F9FAFB]"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirmBooking}
                  disabled={availableFacilities.length === 0}
                  className="px-4 py-2.5 bg-[#465FFF] text-white rounded-lg font-semibold hover:bg-[#3641F5] disabled:opacity-50"
                >
                  Confirm Booking
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
