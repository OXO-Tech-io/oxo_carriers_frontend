'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import {
  CalendarIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import LeaveCalendarModal from '@/components/modals/LeaveCalendarModal';

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

export default function LeaveCalendarPage() {
  const { user, isHR } = useAuth();
  const [entries, setEntries] = useState<LeaveCalendarEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LeaveCalendarEntry | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    name: '',
    description: '',
    is_recurring: false,
    year: new Date().getFullYear(),
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isHR) {
      fetchEntries();
    }
  }, [selectedYear, isHR]);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/leave-calendar?year=${selectedYear}`);
      setEntries(response.data.data || []);
    } catch (err: any) {
      console.error('Error fetching calendar entries:', err);
      setError(err.response?.data?.message || 'Failed to fetch calendar entries');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formDataToSubmit: {
    date: string;
    name: string;
    description: string;
    is_recurring: boolean;
    year: number;
  }) => {
    setError('');
    setSuccess('');

    try {
      if (editingEntry) {
        await api.put(`/leave-calendar/${editingEntry.id}`, formDataToSubmit);
        setSuccess('Calendar entry updated successfully');
      } else {
        await api.post('/leave-calendar', formDataToSubmit);
        setSuccess('Calendar entry created successfully');
      }
      setShowModal(false);
      setEditingEntry(null);
      setFormData({
        date: '',
        name: '',
        description: '',
        is_recurring: false,
        year: new Date().getFullYear(),
      });
      fetchEntries();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save calendar entry');
    }
  };

  const handleEdit = (entry: LeaveCalendarEntry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date.split('T')[0],
      name: entry.name,
      description: entry.description || '',
      is_recurring: entry.is_recurring,
      year: entry.year || new Date().getFullYear(),
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this calendar entry?')) {
      return;
    }

    try {
      await api.delete(`/leave-calendar/${id}`);
      setSuccess('Calendar entry deleted successfully');
      fetchEntries();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete calendar entry');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingEntry(null);
    setFormData({
      date: '',
      name: '',
      description: '',
      is_recurring: false,
      year: new Date().getFullYear(),
    });
    setError('');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!isHR) {
    return (
      <div className="p-6">
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          You don't have permission to access this page.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#101828]">Leave Calendar</h1>
          <p className="mt-1 text-sm text-[#667085]">
            Manage public holidays and calendar events that affect leave calculations
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="rounded-lg border border-[#D0D5DD] px-4 py-2 text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF]"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[#465FFF] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3A4FCC] transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Add Holiday
          </button>
        </div>
      </div>

      {success && (
        <div className="mb-4 rounded-lg bg-green-50 p-4 text-green-800">
          {success}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-[#667085]">Loading calendar entries...</div>
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-lg border border-[#E4E7EC] bg-white p-12 text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-[#98A2B3]" />
          <h3 className="mt-4 text-lg font-semibold text-[#101828]">No holidays found</h3>
          <p className="mt-2 text-sm text-[#667085]">
            Get started by adding a holiday to the calendar.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-[#E4E7EC] bg-white overflow-hidden">
          <table className="min-w-full divide-y divide-[#E4E7EC]">
            <thead className="bg-[#F9FAFB]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#667085]">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#667085]">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#667085]">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#667085]">
                  Type
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#667085]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC] bg-white">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-[#F9FAFB]">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-[#101828]">
                    {formatDate(entry.date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#101828]">{entry.name}</td>
                  <td className="px-6 py-4 text-sm text-[#667085]">
                    {entry.description || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-[#667085]">
                    {entry.is_recurring ? (
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                        Recurring
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                        One-time
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="text-[#465FFF] hover:text-[#3A4FCC]"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <LeaveCalendarModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        editingEntry={editingEntry}
        formData={formData}
        setFormData={setFormData}
        error={error}
      />
    </div>
  );
}
