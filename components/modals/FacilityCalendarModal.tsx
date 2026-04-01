'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BuildingOfficeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Facility, FacilityBooking } from '@/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from 'date-fns';

interface FacilityCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  facility: Facility | null;
}

export default function FacilityCalendarModal({ isOpen, onClose, facility }: FacilityCalendarModalProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookings, setBookings] = useState<FacilityBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && facility) {
      fetchBookings();
    }
  }, [isOpen, facility, currentMonth]);

  const fetchBookings = async () => {
    if (!facility) return;
    try {
      setLoading(true);
      const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
      
      const response = await api.get(`/facilities/all-bookings?start_date=${start}&end_date=${end}&facility_id=${facility.id}`);
      setBookings(response.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !facility) return null;

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const startDay = startOfMonth(currentMonth).getDay();
  const endDay = endOfMonth(currentMonth).getDay();

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
        <div className="fixed inset-0 bg-gray-500/75 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

        <div className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 w-full max-w-4xl">
          <div className="bg-white px-6 py-4 border-b border-[#E4E7EC] flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-[#ECF3FF] rounded-lg">
                <BuildingOfficeIcon className="h-5 w-5 text-[#465FFF]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#101828]">{facility.name} Schedule</h3>
                <p className="text-xs text-[#667085]">View existing reservations for this facility</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-[#F9FAFB] rounded-lg transition-colors">
              <XMarkIcon className="h-6 w-6 text-[#667085]" />
            </button>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="p-2 hover:bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg transition-colors"
                >
                  <ChevronLeftIcon className="h-4 w-4 text-[#667085]" />
                </button>
                <h4 className="text-lg font-bold text-[#101828] min-w-[150px] text-center">
                  {format(currentMonth, 'MMMM yyyy')}
                </h4>
                <button
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="p-2 hover:bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg transition-colors"
                >
                  <ChevronRightIcon className="h-4 w-4 text-[#667085]" />
                </button>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <span className="w-3 h-3 rounded-full bg-[#465FFF]"></span>
                  <span className="text-xs text-[#667085]">Booked</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-3 h-3 rounded-full border border-[#DDE9FF] bg-white"></span>
                  <span className="text-xs text-[#667085]">Available</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E4E7EC] overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center h-[400px]">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#465FFF] border-t-transparent"></div>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className="grid grid-cols-7 border-b border-[#E4E7EC] bg-[#F9FAFB]">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="py-2.5 text-center text-[10px] font-bold text-[#667085] uppercase tracking-wider">
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 auto-rows-fr">
                    {Array.from({ length: startDay }).map((_, i) => (
                      <div key={`pad-${i}`} className="border-b border-r border-[#E4E7EC] bg-[#F8F9FC]/30 min-h-[80px]"></div>
                    ))}
                    
                    {days.map(day => {
                      const dayBookings = bookings.filter(b => isSameDay(new Date(b.start_time), day));
                      return (
                        <div 
                          key={day.toISOString()} 
                          className={`border-b border-r border-[#E4E7EC] p-1.5 min-h-[80px] transition-colors ${isToday(day) ? 'bg-blue-50/40' : 'hover:bg-[#F9FAFB]'}`}
                        >
                          <div className="flex justify-start mb-1">
                            <span className={`text-[10px] font-bold h-6 w-6 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-[#465FFF] text-white' : 'text-[#667085]'}`}>
                              {format(day, 'd')}
                            </span>
                          </div>
                          <div className="space-y-0.5 max-h-[60px] overflow-y-auto custom-scrollbar">
                            {dayBookings.map(b => (
                              <div 
                                key={b.id} 
                                className="text-[9px] px-1.5 py-0.5 rounded bg-[#ECF3FF] border border-[#DDE9FF] text-[#465FFF] truncate font-medium"
                                title={`${format(new Date(b.start_time), 'hh:mm a')} - ${format(new Date(b.end_time), 'hh:mm a')}`}
                              >
                                {format(new Date(b.start_time), 'HH:mm')} - {format(new Date(b.end_time), 'HH:mm')}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {Array.from({ length: 6 - endDay }).map((_, i) => (
                      <div key={`pad-end-${i}`} className="border-b border-[#E4E7EC] bg-[#F8F9FC]/30 min-h-[80px]"></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-[#F9FAFB] px-6 py-4 border-t border-[#E4E7EC] flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-[#344054] bg-white border border-[#D0D5DD] rounded-lg hover:bg-gray-50"
            >
              Close View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
