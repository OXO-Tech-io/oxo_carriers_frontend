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
  const { isHR } = useAuth();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isHR) {
      fetchFacilities();
    }
  }, [isHR]);

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

  if (!isHR) return <div className="p-8 text-center">Unauthorized</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-[#101828]">Facility Management</h1>
          <p className="text-[#475467]">Manage workstations, rooms and accommodation</p>
        </div>
        <button
          onClick={() => {
            setSelectedFacility(null);
            setShowModal(true);
          }}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#465FFF] text-white rounded-xl font-semibold hover:bg-[#3641F5] shadow-sm"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Add Area</span>
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}
      {success && <div className="p-4 bg-emerald-50 text-emerald-700 rounded-lg">{success}</div>}

      <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] overflow-hidden">
        <table className="min-w-full divide-y divide-[#E4E7EC]">
          <thead className="bg-[#F9FAFB]">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase">Name</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase">Type</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase">Capacity</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase">Status</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-[#344054] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-[#E4E7EC]">
            {loading ? (
              <tr><td colSpan={5} className="py-20 text-center">Loading...</td></tr>
            ) : facilities.length === 0 ? (
              <tr><td colSpan={5} className="py-20 text-center text-[#475467]">No facilities found.</td></tr>
            ) : (
              facilities.map((f) => (
                <tr key={f.id} className="hover:bg-[#F9FAFB]">
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-[#101828]">{f.name}</div>
                    <div className="text-xs text-[#667085] truncate max-w-xs">{f.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="capitalize text-sm">{f.type.replace('_', ' ')}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">{f.capacity}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${f.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                      {f.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button onClick={() => { setSelectedFacility(f); setShowModal(true); }} className="p-2 text-[#465FFF] hover:bg-blue-50 rounded-lg">
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button onClick={() => handleDelete(f.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
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
