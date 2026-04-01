'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BuildingOfficeIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { Facility, FacilityBooking } from '@/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from 'date-fns';

export default function AdminBookingCalendarPage() {
  const { isHR } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookings, setBookings] = useState<FacilityBooking[]>([]);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isHR) {
      fetchFacilities();
      fetchBookings();
    }
  }, [currentMonth, selectedFacility, isHR]);

  const fetchFacilities = async () => {
    try {
      const response = await api.get('/facilities');
      setFacilities(response.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      
      let url = `/facilities/all-bookings?start_date=${start}&end_date=${end}`;
      if (selectedFacility !== 'all') {
        url += `&facility_id=${selectedFacility}`;
      }
      
      const response = await api.get(url);
      setBookings(response.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  if (!isHR) return <div className="p-8 text-center font-bold">Unauthorized</div>;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#101828]">Booking Calendar</h1>
          <p className="text-[#475467]">Overview of all facility reservations</p>
        </div>
        
        <div className="flex items-center space-x-3 bg-white p-2 rounded-xl border border-[#E4E7EC] shadow-sm">
          <select
            value={selectedFacility}
            onChange={(e) => setSelectedFacility(e.target.value)}
            className="text-sm border-none focus:ring-0 font-medium text-[#344054]"
          >
            <option value="all">All Facilities</option>
            {facilities.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
          <div className="h-6 w-[1px] bg-[#E4E7EC]"></div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1.5 hover:bg-[#F9FAFB] rounded-lg transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4 text-[#667085]" />
            </button>
            <span className="text-sm font-bold text-[#101828] min-w-[120px] text-center">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1.5 hover:bg-[#F9FAFB] rounded-lg transition-colors"
            >
              <ChevronRightIcon className="h-4 w-4 text-[#667085]" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#E4E7EC] shadow-sm overflow-hidden min-h-[600px]">
        {loading ? (
          <div className="flex items-center justify-center h-[600px]">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#465FFF] border-t-transparent"></div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Calendar Headers */}
            <div className="grid grid-cols-7 border-b border-[#E4E7EC] bg-[#F9FAFB]">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-3 text-center text-xs font-bold text-[#667085] uppercase tracking-wider">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 auto-rows-fr h-full">
              {/* Padding for start of month */}
              {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                <div key={`pad-${i}`} className="border-b border-r border-[#E4E7EC] bg-[#F8F9FC]/30 min-h-[120px]"></div>
              ))}
              
              {days.map(day => {
                const dayBookings = bookings.filter(b => isSameDay(new Date(b.start_time), day));
                return (
                  <div key={day.toISOString()} className={`border-b border-r border-[#E4E7EC] p-2 min-h-[120px] hover:bg-[#F9FAFB] transition-colors ${isToday(day) ? 'bg-blue-50/30' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className={`text-sm font-bold h-7 w-7 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-[#465FFF] text-white' : 'text-[#667085]'}`}>
                        {format(day, 'd')}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {dayBookings.slice(0, 3).map(b => (
                        <div 
                          key={b.id} 
                          className="text-[10px] p-1.5 rounded-lg bg-white border border-[#DDE9FF] shadow-xs truncate cursor-default group relative active:scale-[0.98] transition-all"
                          title={`${b.facility_name}: ${b.first_name} ${b.last_name}`}
                        >
                          <div className="flex items-center space-x-1 mb-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#465FFF]"></span>
                            <span className="font-bold text-[#101828]">{format(new Date(b.start_time), 'HH:mm')}</span>
                          </div>
                          <div className="text-[#344054] truncate font-medium">{b.facility_name}</div>
                          <div className="text-[#667085] truncate italic">by {b.first_name}</div>
                        </div>
                      ))}
                      {dayBookings.length > 3 && (
                        <div className="text-[10px] text-center font-bold text-[#465FFF] bg-[#ECF3FF] py-1 rounded-md">
                          + {dayBookings.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Padding for end of month */}
              {Array.from({ length: 6 - endOfMonth(currentMonth).getDay() }).map((_, i) => (
                <div key={`pad-end-${i}`} className="border-b border-[#E4E7EC] bg-[#F8F9FC]/30 min-h-[120px]"></div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* List version for mobile/details */}
      <div className="bg-white rounded-2xl border border-[#E4E7EC] shadow-sm p-6 overflow-hidden">
        <h2 className="text-xl font-bold text-[#101828] mb-6 flex items-center">
          <CalendarIcon className="h-5 w-5 mr-2 text-[#465FFF]" />
          Detailed Schedule
        </h2>
        <div className="space-y-4">
          {bookings.length === 0 ? (
            <div className="text-center py-10 text-[#667085]">No bookings found for this period.</div>
          ) : (
            bookings.map((b) => (
              <div key={b.id} className="flex items-start p-4 rounded-xl border border-[#F2F4F7] hover:border-blue-200 hover:bg-blue-50/20 transition-all group">
                <div className="bg-[#ECF3FF] p-3 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                  <BuildingOfficeIcon className="h-6 w-6 text-[#465FFF]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-[#101828] truncate">{b.facility_name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                      b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                    <div className="flex items-center text-sm text-[#475467]">
                      <CalendarIcon className="h-4 w-4 mr-1 text-[#98A2B3]" />
                      {format(new Date(b.start_time), 'MMM d, yyyy')} ({format(new Date(b.start_time), 'hh:mm a')} - {format(new Date(b.end_time), 'hh:mm a')})
                    </div>
                    <div className="flex items-center text-sm text-[#475467]">
                      <UserIcon className="h-4 w-4 mr-1 text-[#98A2B3]" />
                      {b.first_name} {b.last_name}
                    </div>
                  </div>
                  {b.purpose && (
                    <p className="mt-2 text-sm text-[#667085] bg-gray-50 p-2 rounded-lg border border-gray-100">
                      <span className="font-semibold">Purpose:</span> {b.purpose}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
