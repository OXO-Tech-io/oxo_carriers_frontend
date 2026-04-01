'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import DateRangePicker from '@/components/DateRangePicker';

interface LeaveCalendarEntry {
  id: number;
  date: string;
  name: string;
  description?: string;
  is_recurring: boolean;
  year?: number;
  created_at: string;
  updated_at: string;
}

interface LeaveCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: {
    date: string;
    name: string;
    description: string;
    is_recurring: boolean;
    year: number;
  }) => Promise<void>;
  editingEntry: LeaveCalendarEntry | null;
  formData: {
    date: string;
    name: string;
    description: string;
    is_recurring: boolean;
    year: number;
  };
  setFormData: React.Dispatch<React.SetStateAction<{
    date: string;
    name: string;
    description: string;
    is_recurring: boolean;
    year: number;
  }>>;
  error: string;
}

export default function LeaveCalendarModal({
  isOpen,
  onClose,
  onSubmit,
  editingEntry,
  formData,
  setFormData,
  error,
}: LeaveCalendarModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Set initial date if editing
      if (editingEntry && formData.date) {
        setSelectedDate(new Date(formData.date));
        setSelectedEndDate(null);
      } else {
        setSelectedDate(null);
        setSelectedEndDate(null);
      }
    }
  }, [isOpen, editingEntry, formData.date]);

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setSelectedDate(start);
    setSelectedEndDate(end);
    if (start) {
      // For single date selection (holidays are typically single dates)
      setFormData({ ...formData, date: format(start, 'yyyy-MM-dd') });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-4xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#101828]">
            {editingEntry ? 'Edit Holiday' : 'Add Holiday'}
          </h2>
          <button
            onClick={onClose}
            className="text-[#667085] hover:text-[#101828]"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#344054] mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <DateRangePicker
              startDate={selectedDate}
              endDate={selectedEndDate}
              onChange={handleDateRangeChange}
              selectsRange={true}
              inline={true}
              monthsShown={2}
              showHolidays={true}
            />
            <p className="text-xs text-blue-600 mt-2">
              Note: Weekends (Saturday and Sunday) are automatically considered as mandatory holidays and excluded from leave calculations.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#344054] mb-2">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., New Year's Day"
              className="block w-full rounded-lg border border-[#D0D5DD] px-3 py-2.5 text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#344054] mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
              rows={3}
              className="block w-full rounded-lg border border-[#D0D5DD] px-3 py-2.5 text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF]"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#344054] mb-2">
              Year
            </label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
              className="block w-full rounded-lg border border-[#D0D5DD] px-3 py-2.5 text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF]"
            />
            <p className="mt-1 text-xs text-[#667085]">
              Leave empty or set to null for recurring holidays
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_recurring"
              checked={formData.is_recurring}
              onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
              className="h-4 w-4 rounded border-[#D0D5DD] text-[#465FFF] focus:ring-[#465FFF]"
            />
            <label htmlFor="is_recurring" className="ml-2 text-sm text-[#344054]">
              Recurring holiday (applies every year)
            </label>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-[#D0D5DD] px-4 py-2.5 text-sm font-semibold text-[#344054] hover:bg-[#F9FAFB]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-[#465FFF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#3A4FCC]"
            >
              {editingEntry ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
