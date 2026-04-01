'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import {
  BuildingOfficeIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { Facility, FacilityType, FacilityBooking } from '@/types';
import BookingModal from '@/components/modals/BookingModal';
import BookAnyModal from '@/components/modals/BookAnyModal';
import FacilityCalendarModal from '@/components/modals/FacilityCalendarModal';
import { format } from 'date-fns';

const FACILITY_TYPE_ORDER: FacilityType[] = [
  FacilityType.WORKSTATION,
  FacilityType.BOARD_ROOM,
  FacilityType.MEETING_ROOM,
  FacilityType.ACCOMMODATION,
];

const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  [FacilityType.WORKSTATION]: 'Workstation',
  [FacilityType.BOARD_ROOM]: 'Board Room',
  [FacilityType.MEETING_ROOM]: 'Meeting Room',
  [FacilityType.ACCOMMODATION]: 'Accommodation',
};

export default function FacilitiesPage() {
  const { user } = useAuth();
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [bookings, setBookings] = useState<FacilityBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [activeTab, setActiveTab] = useState<'available' | 'my-bookings'>('available');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showBookAnyModal, setShowBookAnyModal] = useState(false);
  const [bookAnyPreSelectType, setBookAnyPreSelectType] = useState<FacilityType | null>(null);

  const facilitiesByType = useMemo(() => {
    const map: Record<FacilityType, Facility[]> = {
      [FacilityType.WORKSTATION]: [],
      [FacilityType.BOARD_ROOM]: [],
      [FacilityType.MEETING_ROOM]: [],
      [FacilityType.ACCOMMODATION]: [],
    };
    facilities.forEach((f) => {
      if (map[f.type]) map[f.type].push(f);
    });
    return map;
  }, [facilities]);

  useEffect(() => {
    fetchFacilities();
    fetchMyBookings();
  }, []);

  const fetchFacilities = async () => {
    try {
      const response = await api.get('/facilities');
      setFacilities(response.data.filter((f: Facility) => f.is_active) || []);
    } catch (err) {
      setError('Failed to load facilities');
    }
  };

  const fetchMyBookings = async () => {
    try {
      const response = await api.get('/facilities/my-bookings');
      setBookings(response.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSubmit = async (data: any) => {
    try {
      await api.post('/facilities/book', data);
      setSuccess('Booking confirmed successfully!');
      setShowBookingModal(false);
      fetchMyBookings();
      setActiveTab('my-bookings');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Booking failed');
    }
  };

  const handleCancelBooking = async (id: number) => {
    if (!confirm('Cancel this booking?')) return;
    try {
      await api.put(`/facilities/bookings/${id}/cancel`);
      setSuccess('Booking cancelled');
      fetchMyBookings();
    } catch (err) {
      setError('Failed to cancel');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#101828]">Facilities</h1>
          <p className="text-[#475467]">Book workstations, meeting rooms and accommodation</p>
        </div>
        <button
          onClick={() => { setBookAnyPreSelectType(null); setShowBookAnyModal(true); }}
          className="px-4 py-2.5 bg-[#465FFF] text-white rounded-xl font-bold hover:bg-[#3641F5] transition-colors"
        >
          Book now (any area)
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl animate-shake">{error}</div>}
      {success && <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl">{success}</div>}

      <div className="flex space-x-1 p-1 bg-[#F2F4F7] rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'available' ? 'bg-white text-[#465FFF] shadow-sm' : 'text-[#667085] hover:text-[#344054]'
          }`}
        >
          Available Areas
        </button>
        <button
          onClick={() => setActiveTab('my-bookings')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'my-bookings' ? 'bg-white text-[#465FFF] shadow-sm' : 'text-[#667085] hover:text-[#344054]'
          }`}
        >
          My Bookings
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center animate-pulse">Loading...</div>
      ) : activeTab === 'available' ? (
        <div className="space-y-10">
          {FACILITY_TYPE_ORDER.map((type) => {
            const list = facilitiesByType[type] || [];
            if (list.length === 0) return null;
            return (
              <section key={type} className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h2 className="text-xl font-bold text-[#101828]">{FACILITY_TYPE_LABELS[type]}</h2>
                  <button
                    type="button"
                    onClick={() => { setBookAnyPreSelectType(type); setShowBookAnyModal(true); }}
                    className="px-3 py-1.5 text-sm font-semibold text-[#465FFF] hover:bg-[#ECF3FF] rounded-lg transition-colors"
                  >
                    Book now (any {FACILITY_TYPE_LABELS[type].toLowerCase()})
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {list.map((f) => (
                    <div key={f.id} className="bg-white rounded-2xl border border-[#E4E7EC] shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="p-3 bg-[#ECF3FF] rounded-xl text-[#465FFF]">
                            <BuildingOfficeIcon className="h-6 w-6" />
                          </div>
                          <span className="px-3 py-1 bg-[#F9FAFB] text-[#344054] rounded-full text-xs font-semibold uppercase tracking-wider">
                            {f.type.replace('_', ' ')}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-[#101828] mb-1">{f.name}</h3>
                        <p className="text-sm text-[#667085] mb-4 line-clamp-2">{f.description || 'No description provided'}</p>
                        
                        <div className="space-y-2 mb-6">
                          <div className="flex items-center text-sm text-[#475467]">
                            <span className="font-semibold mr-2">Capacity:</span> {f.capacity} people
                          </div>
                          {f.facilities && (
                            <div className="flex flex-wrap gap-1">
                              {f.facilities.split(',').map((item, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-blue-50 text-[#465FFF] text-[10px] rounded-md font-medium">
                                  {item.trim()}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col space-y-2">
                          <button
                            onClick={() => {
                              setSelectedFacility(f);
                              setShowBookingModal(true);
                            }}
                            className="w-full py-3 bg-[#465FFF] text-white rounded-xl font-bold hover:bg-[#3641F5] transition-colors active:scale-[0.98] transform"
                          >
                            Book Now
                          </button>
                          <button
                            onClick={() => {
                              setSelectedFacility(f);
                              setShowCalendarModal(true);
                            }}
                            className="w-full py-2 text-[#465FFF] text-sm font-semibold hover:bg-blue-50 rounded-xl transition-colors"
                          >
                            Check existing bookings
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E4E7EC] shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-[#E4E7EC]">
            <thead className="bg-[#F9FAFB]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase">Facility</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase">Date & Time</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase">Purpose</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase">Status</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-[#344054] uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#E4E7EC]">
              {bookings.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-[#667085]">You haven't made any bookings yet.</td></tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-[#101828]">{b.facility_name}</div>
                      <div className="text-xs text-[#667085] capitalize">{b.facility_type?.replace('_', ' ')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-[#344054]">{format(new Date(b.start_time), 'MMM d, yyyy')}</div>
                      <div className="text-xs text-[#667085]">
                        {format(new Date(b.start_time), 'hh:mm a')} - {format(new Date(b.end_time), 'hh:mm a')}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-[#475467]">{b.purpose}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 
                        b.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {b.status === 'confirmed' && new Date(b.start_time) > new Date() && (
                        <button
                          onClick={() => handleCancelBooking(b.id)}
                          className="text-xs font-bold text-red-600 hover:text-red-800 underline"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showBookingModal && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
          onSubmit={handleBookingSubmit}
          facility={selectedFacility}
        />
      )}
      {showBookAnyModal && (
        <BookAnyModal
          isOpen={showBookAnyModal}
          onClose={() => setShowBookAnyModal(false)}
          onSuccess={() => {
            setSuccess('Booking confirmed successfully!');
            fetchMyBookings();
            setActiveTab('my-bookings');
          }}
          initialType={bookAnyPreSelectType}
        />
      )}
       {showCalendarModal && (
        <FacilityCalendarModal
          isOpen={showCalendarModal}
          onClose={() => setShowCalendarModal(false)}
          facility={selectedFacility}
        />
      )}
    </div>
  );
}
