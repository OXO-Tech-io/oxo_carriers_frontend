'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import {
  CalendarIcon,
  PlusIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentArrowUpIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { format, isWeekend, isSameDay, startOfDay, endOfDay } from 'date-fns';
import DateRangePicker from '@/components/DateRangePicker';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface LeaveType {
  id: number;
  name: string;
  description: string;
  max_days: number;
  is_active: boolean;
}

interface LeaveBalance {
  id: number;
  leave_type_id: number;
  total_days: number;
  used_days: number;
  remaining_days: number;
  year: number;
  leave_type: LeaveType;
}

interface LeaveRequest {
  id: number;
  leave_type_id: number;
  start_date: string;
  end_date: string;
  total_days: number;
  is_half_day?: boolean;
  half_day_period?: 'morning' | 'evening';
  reason?: string;
  status: 'pending' | 'team_leader_approved' | 'hr_approved' | 'rejected' | 'cancelled';
  team_leader_approval_date?: string;
  hr_approval_date?: string;
  rejection_reason?: string;
  attachment_url?: string;
  created_at: string;
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    employee_id: string;
  };
  leave_type?: LeaveType;
}

type Tab = 'balance' | 'request' | 'history' | 'approvals';

export default function LeavesPage() {
  const { user, isHR } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('balance');
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Request form state
  const [formData, setFormData] = useState({
    leave_type_id: '',
    start_date: '',
    end_date: '',
    reason: '',
    is_half_day: false,
    half_day_period: '' as 'morning' | 'evening' | '',
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDatePicker, setStartDatePicker] = useState<Date | null>(null);
  const [endDatePicker, setEndDatePicker] = useState<Date | null>(null);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [openStartCalendar, setOpenStartCalendar] = useState(false);
  const [openEndCalendar, setOpenEndCalendar] = useState(false);
  
  // Fetch holidays for calculation and date picker
  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        // Fetch holidays for the current year to show in date pickers
        const currentYear = new Date().getFullYear();
        const startDate = new Date(currentYear, 0, 1);
        const endDate = new Date(currentYear, 11, 31);
        
        const response = await api.get(
          `/leave-calendar/range?startDate=${format(startDate, 'yyyy-MM-dd')}&endDate=${format(endDate, 'yyyy-MM-dd')}`
        );
        setHolidays(response.data.data || []);
      } catch (err) {
        console.error('Error fetching holidays:', err);
      }
    };
    fetchHolidays();
  }, []);
  
  // Calculate requested days (excluding weekends and holidays)
  const calculateDays = () => {
    if (!formData.start_date || !formData.end_date) return 0;
    
    // If half-day, return 0.5
    if (formData.is_half_day) {
      return 0.5;
    }
    
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    if (end < start) return 0;
    
    // Get all dates in the range manually
    const dates: Date[] = [];
    const current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    // Filter out weekends and holidays
    const workingDays = dates.filter(date => {
      // Exclude weekends
      if (isWeekend(date)) {
        return false;
      }
      // Exclude custom holidays
      const isHoliday = holidays.some(h => {
        const holidayDate = new Date(h.date);
        return isSameDay(holidayDate, date);
      });
      if (isHoliday) {
        return false;
      }
      return true;
    });
    
    return workingDays.length;
  };
  
  const requestedDays = calculateDays();
  const selectedBalance = formData.leave_type_id 
    ? balances.find(b => b.leave_type_id === parseInt(formData.leave_type_id))
    : null;
  const hasInsufficientBalance = selectedBalance && requestedDays > selectedBalance.remaining_days;
  
  // When half-day is selected, automatically set end_date to start_date
  useEffect(() => {
    if (formData.is_half_day && formData.start_date && formData.end_date !== formData.start_date) {
      setFormData(prev => ({ ...prev, end_date: prev.start_date }));
      setEndDatePicker(startDatePicker);
    }
  }, [formData.is_half_day, formData.start_date, startDatePicker]);

  // Sync date picker with form data
  useEffect(() => {
    if (formData.start_date) {
      setStartDatePicker(new Date(formData.start_date));
    } else {
      setStartDatePicker(null);
    }
    if (formData.end_date && !formData.is_half_day) {
      setEndDatePicker(new Date(formData.end_date));
    } else {
      setEndDatePicker(null);
    }
  }, [formData.start_date, formData.end_date, formData.is_half_day]);

  // Day class name for calendar styling with range highlighting
  const getDayClassName = (date: Date, isStartPicker: boolean = false) => {
    const classes: string[] = [];
    const isWeekendDay = isWeekend(date);
    const isHoliday = holidays.some(h => {
      const holidayDate = new Date(h.date);
      return isSameDay(holidayDate, date);
    });
    
    if (isWeekendDay) {
      classes.push('react-datepicker__day--weekend');
    }
    if (isHoliday && !isWeekendDay) {
      classes.push('holiday-day');
    }

    // Add range highlighting if both dates are selected (show full range including weekends/holidays)
    if (startDatePicker && endDatePicker) {
      const dateStart = startOfDay(date);
      const rangeStart = startOfDay(startDatePicker);
      const rangeEnd = endOfDay(endDatePicker);
      
      // Highlight all dates in range (including weekends and holidays for visual reference)
      // Manual check if date is within interval
      if (dateStart >= rangeStart && dateStart <= rangeEnd) {
        classes.push('react-datepicker__day--in-range');
      }
      
      if (isSameDay(date, startDatePicker)) {
        classes.push('react-datepicker__day--range-start');
      }
      
      if (isSameDay(date, endDatePicker)) {
        classes.push('react-datepicker__day--range-end');
      }
    } else if (startDatePicker && !endDatePicker && isSameDay(date, startDatePicker)) {
      classes.push('react-datepicker__day--range-start');
    }
    
    return classes.join(' ');
  };

  // Handle date range change from picker
  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setStartDatePicker(start);
    setEndDatePicker(end);
    if (start) {
      setFormData(prev => ({ ...prev, start_date: format(start, 'yyyy-MM-dd') }));
    }
    if (end) {
      setFormData(prev => ({ ...prev, end_date: format(end, 'yyyy-MM-dd') }));
    } else if (start && formData.is_half_day) {
      // For half-day, end date should be same as start
      setFormData(prev => ({ ...prev, end_date: format(start, 'yyyy-MM-dd') }));
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch leave types and balance
      const [typesRes, balanceRes] = await Promise.all([
        api.get('/leaves/types'),
        api.get('/leaves/balance'),
      ]);

      setLeaveTypes(typesRes.data.types || []);
      setBalances(balanceRes.data.balances || []);

      // Fetch requests based on tab
      if (activeTab === 'history' || activeTab === 'approvals') {
        const params = new URLSearchParams();
        if (activeTab === 'approvals') {
          params.append('status', 'pending');
        }
        const queryString = params.toString();
        const response = await api.get(`/leaves${queryString ? `?${queryString}` : ''}`);
        setRequests(response.data.requests || []);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('leave_type_id', formData.leave_type_id);
      formDataToSend.append('start_date', formData.start_date);
      // For half-day, end_date should be same as start_date
      formDataToSend.append('end_date', formData.is_half_day ? formData.start_date : formData.end_date);
      formDataToSend.append('reason', formData.reason);
      formDataToSend.append('is_half_day', formData.is_half_day.toString());
      if (formData.is_half_day && formData.half_day_period) {
        formDataToSend.append('half_day_period', formData.half_day_period);
      }
      if (attachment) {
        formDataToSend.append('document', attachment);
      }

      const response = await api.post('/leaves', formDataToSend, {
        // Do not set Content-Type: axios sets it with the correct boundary for FormData
      });

      setSuccess(response.data.message || 'Leave request submitted successfully');
      setFormData({
        leave_type_id: '',
        start_date: '',
        end_date: '',
        reason: '',
        is_half_day: false,
        half_day_period: '',
      });
      setAttachment(null);
      fetchData();
      setActiveTab('history');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (requestId: number, approvedBy: 'team_leader' | 'hr') => {
    try {
      setError('');
      await api.put(`/leaves/${requestId}/approve`, { approvedBy });
      setSuccess('Leave request approved successfully');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve leave request');
    }
  };

  const handleReject = async (requestId: number, rejectionReason: string) => {
    try {
      setError('');
      await api.put(`/leaves/${requestId}/reject`, { rejectionReason });
      setSuccess('Leave request rejected');
      fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject leave request');
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-700',
      team_leader_approved: 'bg-blue-100 text-blue-700',
      hr_approved: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending',
      team_leader_approved: 'Team Leader Approved',
      hr_approved: 'Approved',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#101828]">Leave Management</h1>
          <p className="mt-2 text-[#475467]">Manage your leave requests and balances</p>
        </div>
        <button
          onClick={() => setActiveTab('request')}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#465FFF] text-white rounded-xl font-semibold hover:bg-[#3641F5] transition-colors shadow-sm hover:shadow-md"
        >
          <PlusIcon className="h-5 w-5" />
          <span>Request Leave</span>
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 p-4 rounded-lg">
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[#E4E7EC]">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('balance')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'balance'
                ? 'border-[#465FFF] text-[#465FFF]'
                : 'border-transparent text-[#475467] hover:text-[#344054] hover:border-[#D0D5DD]'
            }`}
          >
            Leave Balance
          </button>
          <button
            onClick={() => setActiveTab('request')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'request'
                ? 'border-[#465FFF] text-[#465FFF]'
                : 'border-transparent text-[#475467] hover:text-[#344054] hover:border-[#D0D5DD]'
            }`}
          >
            Request Leave
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'history'
                ? 'border-[#465FFF] text-[#465FFF]'
                : 'border-transparent text-[#475467] hover:text-[#344054] hover:border-[#D0D5DD]'
            }`}
          >
            My Requests
          </button>
          {isHR && (
            <button
              onClick={() => setActiveTab('approvals')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'approvals'
                  ? 'border-[#465FFF] text-[#465FFF]'
                  : 'border-transparent text-[#475467] hover:text-[#344054] hover:border-[#D0D5DD]'
              }`}
            >
              Pending Approvals
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {loading ? (
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#465FFF] border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* Leave Balance Tab */}
          {activeTab === 'balance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {balances.map((balance) => (
                <div
                  key={balance.id}
                  className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-[#101828]">{balance.leave_type?.name || 'Unknown Leave Type'}</h3>
                      <p className="text-sm text-[#475467] mt-1">{balance.leave_type?.description || ''}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-[#ECF3FF]">
                      <CalendarIcon className="h-6 w-6 text-[#465FFF]" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#475467]">Total Days</span>
                      <span className="text-sm font-semibold text-[#101828]">{balance.total_days}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#475467]">Used Days</span>
                      <span className="text-sm font-semibold text-[#101828]">{balance.used_days}</span>
                    </div>
                    <div className="pt-3 border-t border-[#E4E7EC]">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-[#344054]">Remaining</span>
                        <span className="text-lg font-bold text-[#465FFF]">{balance.remaining_days} days</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Request Leave Tab */}
          {activeTab === 'request' && (
            <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-6 lg:p-8">
              <h2 className="text-xl font-bold text-[#101828] mb-6">Submit Leave Request</h2>
              <form onSubmit={handleSubmitRequest} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-[#344054] mb-2">
                      Leave Type *
                    </label>
                    <select
                      required
                      value={formData.leave_type_id}
                      onChange={(e) => setFormData({ ...formData, leave_type_id: e.target.value })}
                      className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm font-medium text-[#344054] bg-white focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                    >
                      <option value="">Select leave type</option>
                      {leaveTypes
                        .filter((type) => type.is_active)
                        .map((type) => {
                          const balance = balances.find((b) => b.leave_type_id === type.id);
                          return (
                            <option key={type.id} value={type.id}>
                              {type.name} {balance && `(${balance.remaining_days} days remaining)`}
                            </option>
                          );
                        })}
                    </select>
                    {selectedBalance && (
                      <div className="mt-2 p-3 bg-[#ECF3FF] border border-[#DDE9FF] rounded-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-[#344054]">Available Balance:</span>
                          <span className="text-sm font-bold text-[#465FFF]">{selectedBalance.remaining_days} days</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#344054] mb-2">
                      Attachment (Optional)
                    </label>
                    <div className="flex items-center space-x-3">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                        <div className="flex items-center space-x-2 px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#475467] hover:bg-[#F9FAFB] transition-colors">
                          <DocumentArrowUpIcon className="h-5 w-5" />
                          <span>{attachment ? attachment.name : 'Choose file'}</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#344054] mb-2">
                    Leave Date Range {formData.is_half_day ? '(Half Day)' : '*'}
                  </label>
                  <div className="relative">
                    {!showDatePicker ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 relative">
                            <label className="block text-xs text-[#667085] mb-1">Start Date</label>
                            <div className="relative">
                              <DatePicker
                                selected={startDatePicker}
                                onChange={(date: Date | null) => {
                                  setStartDatePicker(date);
                                  if (date) {
                                    const dateStr = format(date, 'yyyy-MM-dd');
                                    setFormData({ ...formData, start_date: dateStr });
                                  }
                                  setOpenStartCalendar(false);
                                }}
                                startDate={startDatePicker}
                                endDate={endDatePicker}
                                minDate={new Date()}
                                filterDate={(date) => {
                                  if (isWeekend(date)) return false;
                                  const isHoliday = holidays.some(h => {
                                    const holidayDate = new Date(h.date);
                                    return isSameDay(holidayDate, date);
                                  });
                                  return !isHoliday;
                                }}
                                calendarClassName="holiday-calendar"
                                dayClassName={(date) => getDayClassName(date, true)}
                                dateFormat="yyyy-MM-dd"
                                placeholderText="Select start date"
                                open={openStartCalendar}
                                onInputClick={() => setOpenStartCalendar(true)}
                                onClickOutside={() => setOpenStartCalendar(false)}
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode="select"
                                calendarStartDay={1}
                                highlightDates={endDatePicker ? [endDatePicker] : []}
                                customInput={
                                  <input
                                    type="text"
                                    readOnly
                                    value={formData.start_date || ''}
                                    placeholder="Select start date"
                                    className="block w-full px-3 py-2.5 pr-10 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent cursor-pointer"
                                    onClick={() => setOpenStartCalendar(true)}
                                  />
                                }
                                popperContainer={({ children }) => (
                                  <div className="z-50">{children}</div>
                                )}
                                popperPlacement="bottom-start"
                              />
                              <button
                                type="button"
                                onClick={() => setOpenStartCalendar(true)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#667085] hover:text-[#465FFF]"
                              >
                                <CalendarIcon className="h-5 w-5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex-1 relative">
                            <label className="block text-xs text-[#667085] mb-1">
                              End Date {formData.is_half_day ? '(Auto)' : ''}
                            </label>
                            <div className="relative">
                              <DatePicker
                                selected={endDatePicker}
                                onChange={(date: Date | null) => {
                                  setEndDatePicker(date);
                                  if (date) {
                                    const dateStr = format(date, 'yyyy-MM-dd');
                                    setFormData({ ...formData, end_date: dateStr });
                                  }
                                  setOpenEndCalendar(false);
                                }}
                                startDate={startDatePicker}
                                endDate={endDatePicker}
                                minDate={startDatePicker || new Date()}
                                disabled={formData.is_half_day}
                                filterDate={(date) => {
                                  if (isWeekend(date)) return false;
                                  const isHoliday = holidays.some(h => {
                                    const holidayDate = new Date(h.date);
                                    return isSameDay(holidayDate, date);
                                  });
                                  return !isHoliday;
                                }}
                                calendarClassName="holiday-calendar"
                                dayClassName={(date) => getDayClassName(date, false)}
                                dateFormat="yyyy-MM-dd"
                                placeholderText="Select end date"
                                open={openEndCalendar}
                                onInputClick={() => !formData.is_half_day && setOpenEndCalendar(true)}
                                onClickOutside={() => setOpenEndCalendar(false)}
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode="select"
                                calendarStartDay={1}
                                highlightDates={startDatePicker ? [startDatePicker] : []}
                                customInput={
                                  <input
                                    type="text"
                                    readOnly
                                    value={formData.is_half_day ? formData.start_date : (formData.end_date || '')}
                                    placeholder="Select end date"
                                    disabled={formData.is_half_day}
                                    className="block w-full px-3 py-2.5 pr-10 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent disabled:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:text-[#98A2B3] cursor-pointer"
                                    onClick={() => !formData.is_half_day && setOpenEndCalendar(true)}
                                  />
                                }
                                popperContainer={({ children }) => (
                                  <div className="z-50">{children}</div>
                                )}
                                popperPlacement="bottom-start"
                              />
                              <button
                                type="button"
                                onClick={() => !formData.is_half_day && setOpenEndCalendar(true)}
                                disabled={formData.is_half_day}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#667085] hover:text-[#465FFF] disabled:text-[#98A2B3] disabled:cursor-not-allowed"
                              >
                                <CalendarIcon className="h-5 w-5" />
                              </button>
                            </div>
                            {formData.is_half_day && (
                              <p className="mt-1 text-xs text-[#475467]">End date is automatically set to start date for half-day leave</p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowDatePicker(true)}
                          className="w-full px-4 py-2.5 border-2 border-dashed border-[#D0D5DD] rounded-lg text-sm font-medium text-[#465FFF] hover:border-[#465FFF] hover:bg-[#ECF3FF] transition-colors flex items-center justify-center gap-2"
                        >
                          <CalendarIcon className="h-5 w-5" />
                          <span>Open Calendar Picker</span>
                        </button>
                      </div>
                    ) : (
                      <div className="border border-[#D0D5DD] rounded-lg p-4 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-[#344054]">Select Date Range</h3>
                          <button
                            type="button"
                            onClick={() => setShowDatePicker(false)}
                            className="text-sm text-[#465FFF] hover:text-[#3641F5] font-medium"
                          >
                            Use Text Inputs
                          </button>
                        </div>
                        <DateRangePicker
                          startDate={startDatePicker}
                          endDate={endDatePicker}
                          onChange={handleDateRangeChange}
                          selectsRange={!formData.is_half_day}
                          inline={true}
                          monthsShown={2}
                          showHolidays={true}
                          minDate={new Date()}
                          disabled={formData.is_half_day}
                        />
                        {formData.is_half_day && (
                          <p className="mt-2 text-xs text-[#475467] bg-amber-50 p-2 rounded">
                            Half-day leave: End date is automatically set to start date
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="is_half_day"
                      checked={formData.is_half_day}
                      onChange={(e) => {
                        const isHalfDay = e.target.checked;
                        setFormData({ 
                          ...formData, 
                          is_half_day: isHalfDay,
                          end_date: isHalfDay ? formData.start_date : formData.end_date,
                          half_day_period: isHalfDay ? formData.half_day_period : ''
                        });
                      }}
                      className="h-4 w-4 text-[#465FFF] border-[#D0D5DD] rounded focus:ring-[#465FFF]"
                    />
                    <label htmlFor="is_half_day" className="text-sm font-semibold text-[#344054] cursor-pointer">
                      Half-day leave
                    </label>
                  </div>
                  {formData.is_half_day && (
                    <div>
                      <label className="block text-sm font-semibold text-[#344054] mb-2">
                        Time Period *
                      </label>
                      <select
                        required={formData.is_half_day}
                        value={formData.half_day_period}
                        onChange={(e) => setFormData({ ...formData, half_day_period: e.target.value as 'morning' | 'evening' })}
                        className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm font-medium text-[#344054] bg-white focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                      >
                        <option value="">Select time period</option>
                        <option value="morning">Morning</option>
                        <option value="evening">Evening</option>
                      </select>
                    </div>
                  )}
                </div>
                {formData.start_date && (formData.end_date || formData.is_half_day) && (
                  <div className="p-4 bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-lg font-bold ${hasInsufficientBalance ? 'text-[#F04438]' : 'text-[#465FFF]'}`}>
                        {requestedDays === 0.5 ? '0.5 day' : `${requestedDays} ${requestedDays === 1 ? 'day' : 'days'}`}
                        {formData.is_half_day && formData.half_day_period && (
                          <span className="ml-2 text-sm font-normal text-[#475467]">
                            ({formData.half_day_period === 'morning' ? 'Morning' : 'Evening'})
                          </span>
                        )}
                      </span>
                    </div>
                    <p className="text-xs text-[#667085] mt-2">
                      * Weekends (Saturday/Sunday) and holidays are automatically excluded from the calculation
                    </p>
                    {hasInsufficientBalance && selectedBalance && (
                      <div className="mt-2 p-3 bg-[#FEF3C7] border border-[#FCD34D] rounded-lg">
                        <p className="text-sm text-[#92400E]">
                          <strong>⚠️ Insufficient Balance:</strong> You are requesting {requestedDays} days, but only {selectedBalance.remaining_days} days are available.
                        </p>
                      </div>
                    )}
                    {selectedBalance && !hasInsufficientBalance && requestedDays > 0 && (
                      <div className="mt-2 p-3 bg-[#D1FADF] border border-[#6EE7B7] rounded-lg">
                        <p className="text-sm text-[#065F46]">
                          <strong>✓ Sufficient Balance:</strong> {selectedBalance.remaining_days - requestedDays} days will remain after this request.
                        </p>
                      </div>
                    )}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-[#344054] mb-2">
                    Reason *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="Please provide a reason for your leave request..."
                    className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] placeholder:text-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                  />
                </div>
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ 
                        leave_type_id: '', 
                        start_date: '', 
                        end_date: '', 
                        reason: '',
                        is_half_day: false,
                        half_day_period: ''
                      });
                      setAttachment(null);
                    }}
                    className="px-4 py-2.5 text-sm font-semibold text-[#344054] bg-white border border-[#D0D5DD] rounded-lg hover:bg-[#F9FAFB] transition-colors"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || hasInsufficientBalance || !formData.leave_type_id || !formData.start_date || (!formData.end_date && !formData.is_half_day) || !formData.reason || (formData.is_half_day && !formData.half_day_period)}
                    className="px-4 py-2.5 text-sm font-semibold text-white bg-[#465FFF] rounded-lg hover:bg-[#3641F5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#E4E7EC]">
                  <thead className="bg-[#F9FAFB]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase tracking-wider">
                        Leave Type
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase tracking-wider">
                        Dates
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase tracking-wider">
                        Days
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase tracking-wider">
                        Submitted
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#E4E7EC]">
                    {requests.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <ClockIcon className="h-12 w-12 text-[#98A2B3] mx-auto mb-4" />
                          <p className="text-sm font-medium text-[#344054]">No leave requests found</p>
                        </td>
                      </tr>
                    ) : (
                      requests.map((request) => (
                        <tr key={request.id} className="hover:bg-[#F9FAFB] transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <p className="text-sm font-semibold text-[#101828]">{request.leave_type?.name || 'Unknown Leave Type'}</p>
                              {request.reason && (
                                <p className="text-xs text-[#475467] mt-1 line-clamp-1">{request.reason}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm text-[#344054]">
                              {format(new Date(request.start_date), 'MMM dd, yyyy')} - {format(new Date(request.end_date), 'MMM dd, yyyy')}
                            </p>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-[#101828]">
                              {request.total_days === 0.5 ? '0.5 day' : `${request.total_days} days`}
                              {request.is_half_day && request.half_day_period && (
                                <span className="ml-2 text-xs text-[#475467]">
                                  ({request.half_day_period === 'morning' ? 'Morning' : 'Evening'})
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(request.status)}`}>
                              {getStatusLabel(request.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475467]">
                            {format(new Date(request.created_at), 'MMM dd, yyyy')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Approvals Tab (HR Only) */}
          {activeTab === 'approvals' && isHR && (
            <div className="space-y-4">
              {requests.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-12 text-center">
                  <CheckCircleIcon className="h-12 w-12 text-[#98A2B3] mx-auto mb-4" />
                  <p className="text-sm font-medium text-[#344054]">No pending approvals</p>
                </div>
              ) : (
                requests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-2 rounded-lg bg-[#ECF3FF]">
                            <UserIcon className="h-5 w-5 text-[#465FFF]" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#101828]">
                              {request.user?.first_name} {request.user?.last_name}
                            </p>
                            <p className="text-xs text-[#475467]">{request.user?.email}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-[#98A2B3] mb-1">Leave Type</p>
                            <p className="text-sm font-semibold text-[#344054]">{request.leave_type?.name || 'Unknown Leave Type'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[#98A2B3] mb-1">Dates</p>
                            <p className="text-sm font-semibold text-[#344054]">
                              {format(new Date(request.start_date), 'MMM dd')} - {format(new Date(request.end_date), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[#98A2B3] mb-1">Total Days</p>
                            <p className="text-sm font-semibold text-[#344054]">{request.total_days} days</p>
                          </div>
                        </div>
                        {request.reason && (
                          <div className="mb-4">
                            <p className="text-xs text-[#98A2B3] mb-1">Reason</p>
                            <p className="text-sm text-[#475467]">{request.reason}</p>
                          </div>
                        )}
                        {request.attachment_url && (
                          <div className="mb-4">
                            <a
                              href={request.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-2 text-sm text-[#465FFF] hover:text-[#3641F5]"
                            >
                              <DocumentArrowUpIcon className="h-4 w-4" />
                              <span>View Attachment</span>
                            </a>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(request.status)}`}>
                            {getStatusLabel(request.status)}
                          </span>
                          {request.team_leader_approval_date && (
                            <span className="text-xs text-[#475467]">
                              Team Leader approved on {format(new Date(request.team_leader_approval_date), 'MMM dd, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2 ml-4">
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(request.id, 'hr')}
                              className="px-4 py-2 text-sm font-semibold text-white bg-[#10B981] rounded-lg hover:bg-[#059669] transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Please provide a rejection reason:');
                                if (reason) handleReject(request.id, reason);
                              }}
                              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {request.status === 'team_leader_approved' && (
                          <>
                            <button
                              onClick={() => handleApprove(request.id, 'hr')}
                              className="px-4 py-2 text-sm font-semibold text-white bg-[#10B981] rounded-lg hover:bg-[#059669] transition-colors"
                            >
                              Final Approve
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Please provide a rejection reason:');
                                if (reason) handleReject(request.id, reason);
                              }}
                              className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
