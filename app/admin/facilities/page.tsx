'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import {
  BuildingOfficeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { Facility, FacilityType } from '@/types';
import FacilityModal from '@/components/modals/FacilityModal';

export default function AdminFacilitiesPage() {
  const { isHR, isSuperAdmin } = useAuth();
  const canAccess = isHR || isSuperAdmin;
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (canAccess) {
      fetchFacilities();
    }
  }, [canAccess]);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const response = await api.get('/facilities');
      setFacilities(response.data || []);
    } catch (err: any) {
      setError('Failed to fetch facilities');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (data: any) => {
    try {
      if (selectedFacility) {
        await api.put(`/facilities/${selectedFacility.id}`, data);
        setSuccess('Facility updated successfully');
      } else {
        await api.post('/facilities', data);
        setSuccess('Facility created successfully');
      }
      setShowModal(false);
      setSelectedFacility(null);
      fetchFacilities();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure? This will delete the facility and all its bookings.')) return;
    try {
      await api.delete(`/facilities/${id}`);
      setSuccess('Facility deleted');
      fetchFacilities();
    } catch (err: any) {
      setError('Failed to delete');
    }
  };

  if (!canAccess) return <div className="p-8 text-center">Unauthorized</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Facility Management</h1>
          <p className="text-[var(--gray-400)]">Manage workstations, rooms and accommodation</p>
        </div>
        <button
          onClick={() => {
            setSelectedFacility(null);
            setShowModal(true);
          }}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[var(--primary)] text-white rounded-xl font-semibold hover:bg-[var(--primary-hover)] shadow-sm"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Area</span>
        </button>
      </div>

      {error && <div className="p-4 bg-[var(--error-light)] text-[var(--error-text)] rounded-lg">{error}</div>}
      {success && <div className="p-4 bg-[var(--success-light)] text-[var(--success-text)] rounded-lg">{success}</div>}

      <div className="bg-[var(--card-bg)] rounded-2xl shadow-sm border border-[var(--gray-100)] overflow-hidden">
        <table className="min-w-full divide-y divide-[var(--gray-100)]">
          <thead className="bg-[var(--gray-25)]">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-600)] uppercase">Name</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-600)] uppercase">Type</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-600)] uppercase">Capacity</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-600)] uppercase">Status</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-[var(--gray-600)] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-[var(--card-bg)] divide-y divide-[var(--gray-100)]">
            {loading ? (
              <tr><td colSpan={5} className="py-20 text-center">Loading...</td></tr>
            ) : facilities.length === 0 ? (
              <tr><td colSpan={5} className="py-20 text-center text-[var(--gray-400)]">No facilities found.</td></tr>
            ) : (
              facilities.map((f) => (
                <tr key={f.id} className="hover:bg-[var(--gray-25)]">
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-[var(--foreground)]">{f.name}</div>
                    <div className="text-xs text-[var(--gray-400)] truncate max-w-xs">{f.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="capitalize text-sm">{f.type.replace('_', ' ')}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">{f.capacity}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${f.is_active ? 'bg-[var(--success-light)] text-[var(--success-text)]' : 'bg-[var(--gray-100)] text-[var(--gray-500)]'}`}>
                      {f.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => { setSelectedFacility(f); setShowModal(true); }} className="p-2 text-[var(--primary)] hover:bg-[var(--primary-light)] rounded-lg">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDelete(f.id)} className="p-2 text-red-600 hover:bg-[var(--error-light)] rounded-lg">
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <FacilityModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateOrUpdate}
          initialData={selectedFacility}
        />
      )}
    </div>
  );
}
