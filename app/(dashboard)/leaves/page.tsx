'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLeaveTypesQuery } from '@/hooks/queries/use-leave-types-query';
import { useLeaveCoverageCandidatesQuery } from '@/hooks/queries/use-leave-coverage-candidates-query';
import { useLeaveBalanceQuery } from '@/hooks/queries/use-leave-balance-query';
import { useLeaveRequestsQuery } from '@/hooks/queries/use-leave-requests-query';
import { useHolidaysQuery } from '@/hooks/queries/use-holidays-query';
import { useCreateLeaveMutation } from '@/hooks/mutations/use-create-leave-mutation';
import { useApproveLeaveMutation } from '@/hooks/mutations/use-approve-leave-mutation';
import { useRejectLeaveMutation } from '@/hooks/mutations/use-reject-leave-mutation';
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Upload,
  User,
  AlertTriangle,
  History,
  FileSpreadsheet,
} from 'lucide-react';
import { format, isWeekend, isSameDay, startOfDay, endOfDay } from 'date-fns';
import DateRangePicker from '@/components/DateRangePicker';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

type Tab = 'balance' | 'request' | 'history' | 'approvals';

export default function LeavesPage() {
  const { user, isHR, isSuperAdmin } = useAuth();
  const canApprove = isHR || isSuperAdmin;
  const [activeTab, setActiveTab] = useState<Tab>('balance');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);

  // Request form state
  const [formData, setFormData] = useState({
    leave_type_id: '',
    start_date: '',
    end_date: '',
    reason: '',
    is_half_day: false,
    half_day_period: '' as 'morning' | 'evening' | '',
    coverup_employee_id: '',
  });
  const [attachment, setAttachment] = useState<File | null>(null);
  const [startDatePicker, setStartDatePicker] = useState<Date | null>(null);
  const [endDatePicker, setEndDatePicker] = useState<Date | null>(null);
  // Two months side by side only where there's room for it - defaults to
  // desktop-sized on the server render, corrected on mount to avoid a
  // hydration mismatch, then kept in sync as the window is resized.
  const [isDesktopView, setIsDesktopView] = useState(true);
  useEffect(() => {
    const checkViewport = () => setIsDesktopView(window.innerWidth >= 1024);
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Server state via React Query
  const { yearStart, yearEnd } = useMemo(() => {
    const y = new Date().getFullYear();
    return {
      yearStart: format(new Date(y, 0, 1), 'yyyy-MM-dd'),
      yearEnd: format(new Date(y, 11, 31), 'yyyy-MM-dd'),
    };
  }, []);

  const isInternal = user?.employee_category === 'internal';
  const coverageRangeEnd = formData.is_half_day ? formData.start_date : formData.end_date;
  const leaveTypesQuery = useLeaveTypesQuery();
  const coverageCandidatesQuery = useLeaveCoverageCandidatesQuery(isInternal, formData.start_date, coverageRangeEnd);
  const leaveBalanceQuery = useLeaveBalanceQuery(user?.employee_id);
  const leaveRequestsQuery = useLeaveRequestsQuery(
    activeTab === 'approvals' ? { status: 'pending' } : {},
    { enabled: activeTab === 'history' || activeTab === 'approvals' }
  );
  const holidaysQuery = useHolidaysQuery(yearStart, yearEnd);

  const leaveTypes = leaveTypesQuery.data ?? [];
  const coverageCandidates = coverageCandidatesQuery.data ?? [];
  const balances = leaveBalanceQuery.data ?? [];
  const requests = leaveRequestsQuery.data ?? [];
  const holidays = holidaysQuery.data ?? [];

  const createLeaveMutation = useCreateLeaveMutation();
  const approveLeaveMutation = useApproveLeaveMutation();
  const rejectLeaveMutation = useRejectLeaveMutation();

  const submitting = createLeaveMutation.isPending;
  const loading =
    leaveTypesQuery.isLoading ||
    leaveBalanceQuery.isLoading ||
    leaveRequestsQuery.isLoading;

  // Surface query errors
  useEffect(() => {
    const queryError =
      leaveTypesQuery.error ||
      leaveBalanceQuery.error ||
      leaveRequestsQuery.error;
    if (queryError) {
      const message =
        (queryError as { response?: { data?: { message?: string } } })
          ?.response?.data?.message || 'Failed to fetch data';
      setError(message);
    }
  }, [
    leaveTypesQuery.error,
    leaveBalanceQuery.error,
    leaveRequestsQuery.error,
  ]);
  
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
    
    const dates: Date[] = [];
    const current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    const workingDays = dates.filter(date => {
      if (isWeekend(date)) {
        return false;
      }
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
  
  // If the chosen date range changes after a coverup employee was already
  // selected and they now conflict with someone else's leave over the new
  // range, drop the now-invalid selection instead of silently submitting it.
  useEffect(() => {
    if (
      formData.coverup_employee_id &&
      !coverageCandidatesQuery.isLoading &&
      !coverageCandidates.some((c) => c.employee_id === formData.coverup_employee_id)
    ) {
      setFormData((prev) => ({ ...prev, coverup_employee_id: '' }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coverageCandidates, coverageCandidatesQuery.isLoading]);

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



  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setStartDatePicker(start);
    setEndDatePicker(end);
    if (start) {
      setFormData(prev => ({ ...prev, start_date: format(start, 'yyyy-MM-dd') }));
    }
    if (end) {
      setFormData(prev => ({ ...prev, end_date: format(end, 'yyyy-MM-dd') }));
    } else if (start && formData.is_half_day) {
      setFormData(prev => ({ ...prev, end_date: format(start, 'yyyy-MM-dd') }));
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const formDataToSend = new FormData();
    formDataToSend.append('leave_type_id', formData.leave_type_id);
    formDataToSend.append('start_date', formData.start_date);
    formDataToSend.append('end_date', formData.is_half_day ? formData.start_date : formData.end_date);
    if (formData.reason) {
      formDataToSend.append('reason', formData.reason);
    }
    formDataToSend.append('is_half_day', formData.is_half_day.toString());
    if (formData.is_half_day && formData.half_day_period) {
      formDataToSend.append('half_day_period', formData.half_day_period);
    }
    if (attachment) {
      formDataToSend.append('document', attachment);
    }
    if (isInternal && formData.coverup_employee_id) {
      formDataToSend.append('coverup_employee_id', formData.coverup_employee_id);
    }

    try {
      await createLeaveMutation.mutateAsync(formDataToSend);
      setSuccess('Leave request submitted successfully');
      setFormData({
        leave_type_id: '',
        start_date: '',
        end_date: '',
        reason: '',
        is_half_day: false,
        half_day_period: '',
        coverup_employee_id: '',
      });
      setAttachment(null);
      setIsMobileSheetOpen(false);
      setActiveTab('history');
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to submit leave request';
      setError(message);
    }
  };

  const handleApprove = async (requestId: number, approvedBy: 'team_leader' | 'hr') => {
    setError('');
    try {
      await approveLeaveMutation.mutateAsync({ id: requestId, input: { approvedBy } });
      setSuccess('Leave request approved successfully');
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to approve leave request';
      setError(message);
    }
  };

  const handleReject = async (requestId: number, rejectionReason: string) => {
    setError('');
    try {
      await rejectLeaveMutation.mutateAsync({ id: requestId, input: { rejectionReason } });
      setSuccess('Leave request rejected');
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || 'Failed to reject leave request';
      setError(message);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300',
      team_leader_approved: 'bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300',
      hr_approved: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300',
      rejected: 'bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300',
      cancelled: 'bg-gray-100 dark:bg-slate-950/30 text-gray-700 dark:text-slate-300',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending',
      team_leader_approved: 'TL Approved',
      hr_approved: 'Approved',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
    };
    return labels[status] || status;
  };

  const handleRequestClick = () => {
    if (window.innerWidth < 1024) {
      setIsMobileSheetOpen(true);
    } else {
      setActiveTab('request');
    }
  };

  const formContent = (
    <form onSubmit={handleSubmitRequest} className="space-y-5">
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-[var(--gray-500)] uppercase tracking-wider mb-2">
            Leave Type *
          </label>
          <select
            required
            value={formData.leave_type_id}
            onChange={(e) => setFormData({ ...formData, leave_type_id: e.target.value })}
            className="block w-full px-3 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
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
            <div className="mt-2 p-3 bg-blue-500/10 rounded-xl border border-blue-500/10">
              <div className="flex items-center justify-between text-xs font-bold text-[var(--primary)]">
                <span>Available Balance:</span>
                <span>{selectedBalance.remaining_days} days</span>
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--gray-500)] uppercase tracking-wider mb-2">
            Attachment (Optional)
          </label>
          <label className="block cursor-pointer">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(e) => setAttachment(e.target.files?.[0] || null)}
              className="hidden"
            />
            <div className="flex items-center gap-2 px-3 py-2.5 border border-dashed border-[var(--gray-200)] rounded-xl text-sm text-[var(--gray-400)] hover:bg-[var(--gray-50)] transition-colors">
              <Upload className="h-4 w-4 text-[var(--gray-400)] shrink-0" />
              <span className="truncate">{attachment ? attachment.name : 'Click to upload document'}</span>
            </div>
          </label>
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--gray-500)] uppercase tracking-wider mb-2">
            Leave Date Range {formData.is_half_day ? '(Half Day)' : '*'}
          </label>
          <div className="flex justify-center overflow-x-auto">
            <DateRangePicker
              startDate={startDatePicker}
              endDate={formData.is_half_day ? startDatePicker : endDatePicker}
              onChange={handleDateRangeChange}
              minDate={new Date()}
              selectsRange={!formData.is_half_day}
              inline={true}
              monthsShown={formData.is_half_day || !isDesktopView ? 1 : 2}
              showHolidays={true}
            />
          </div>
          {formData.start_date && (
            <div className="mt-3 grid grid-cols-2 gap-4">
              <div>
                <span className="block text-[10px] text-[var(--gray-400)] font-bold uppercase tracking-wider mb-1">Start Date</span>
                <div className="px-3 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--gray-25)]">
                  {formData.start_date}
                </div>
              </div>
              <div>
                <span className="block text-[10px] text-[var(--gray-400)] font-bold uppercase tracking-wider mb-1">
                  End Date {formData.is_half_day ? '(Auto)' : ''}
                </span>
                <div className="px-3 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--gray-25)]">
                  {formData.is_half_day ? formData.start_date : (formData.end_date || 'Not selected')}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
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
              className="h-4 w-4 text-[var(--primary)] border-[var(--gray-200)] rounded focus:ring-[var(--primary)] cursor-pointer"
            />
            <label htmlFor="is_half_day" className="text-sm font-bold text-[var(--foreground)] cursor-pointer select-none">
              Half-day leave
            </label>
          </div>
          
          {formData.is_half_day && (
            <div>
              <label className="block text-xs font-bold text-[var(--gray-500)] uppercase tracking-wider mb-2">
                Time Period *
              </label>
              <select
                required={formData.is_half_day}
                value={formData.half_day_period}
                onChange={(e) => setFormData({ ...formData, half_day_period: e.target.value as 'morning' | 'evening' })}
                className="block w-full px-3 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="">Select time period</option>
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
              </select>
            </div>
          )}
        </div>

        {formData.start_date && (formData.end_date || formData.is_half_day) && (
          <div className="p-4 bg-[var(--gray-25)] border border-[var(--gray-100)] rounded-xl">
            <div className="flex items-center justify-between">
              <span className={`text-base font-extrabold ${hasInsufficientBalance ? 'text-red-500' : 'text-[var(--primary)]'}`}>
                {requestedDays === 0.5 ? '0.5 day' : `${requestedDays} ${requestedDays === 1 ? 'day' : 'days'}`} requested
              </span>
            </div>
            {hasInsufficientBalance && selectedBalance && (
              <div className="mt-2 flex items-start gap-2 text-xs font-medium text-red-600 dark:text-red-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>Insufficient Balance: You only have {selectedBalance.remaining_days} days left.</span>
              </div>
            )}
            {selectedBalance && !hasInsufficientBalance && requestedDays > 0 && (
              <div className="mt-2 flex items-start gap-2 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Sufficient Balance: {selectedBalance.remaining_days - requestedDays} days remaining after approval.</span>
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-[var(--gray-500)] uppercase tracking-wider mb-2">
            Reason *
          </label>
          <textarea
            required
            rows={4}
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Please explain the reason for your request..."
            className="block w-full px-3 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] placeholder:text-[var(--gray-300)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
        </div>

        {isInternal && (
          <div>
            <label className="block text-xs font-bold text-[var(--gray-500)] uppercase tracking-wider mb-2">
              Coverup Employee *
            </label>
            <select
              required
              value={formData.coverup_employee_id}
              onChange={(e) => setFormData({ ...formData, coverup_employee_id: e.target.value })}
              className="block w-full px-3 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="">Select the colleague covering your work</option>
              {coverageCandidates.map((candidate) => (
                <option key={candidate.employee_id} value={candidate.employee_id}>
                  {candidate.first_name} {candidate.last_name}
                  {candidate.department ? ` (${candidate.department})` : ''}
                </option>
              ))}
            </select>
            {formData.start_date && coverageRangeEnd ? (
              <p className="mt-1.5 text-[11px] text-[var(--gray-400)] font-medium">
                Colleagues who already have leave scheduled during these dates aren&apos;t shown.
              </p>
            ) : (
              <p className="mt-1.5 text-[11px] text-[var(--gray-400)] font-medium">
                Pick your date range first to hide colleagues who are already on leave then.
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setFormData({
              leave_type_id: '',
              start_date: '',
              end_date: '',
              reason: '',
              is_half_day: false,
              half_day_period: '',
              coverup_employee_id: ''
            });
            setAttachment(null);
            setIsMobileSheetOpen(false);
          }}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={submitting || hasInsufficientBalance || !formData.leave_type_id || !formData.start_date || (!formData.end_date && !formData.is_half_day) || !formData.reason || (formData.is_half_day && !formData.half_day_period) || (isInternal && !formData.coverup_employee_id)}
          isLoading={submitting}
        >
          Submit
        </Button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">Leave Management</h1>
          <p className="text-sm text-[var(--gray-400)] font-medium mt-1">Manage leave requests, view balances, and approve time-off.</p>
        </div>
        <Button
          onClick={handleRequestClick}
          leftIcon={<Plus className="h-4 w-4" />}
        >
          Request Leave
        </Button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-500/10 border-l-4 border-red-500 text-red-600 dark:text-red-400 p-4 rounded-xl text-xs font-semibold animate-fade-in">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border-l-4 border-emerald-500 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl text-xs font-semibold animate-fade-in">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[var(--gray-100)]">
        <nav className="-mb-px flex gap-6 overflow-x-auto">
          {(['balance', 'request', 'history'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 border-b-2 font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--gray-400)] hover:text-[var(--foreground)]'
              }`}
            >
              {tab === 'balance' ? 'Balances' : tab === 'request' ? 'Request Leave' : 'My Requests'}
            </button>
          ))}
          {canApprove && (
            <button
              onClick={() => setActiveTab('approvals')}
              className={`py-3 px-1 border-b-2 font-bold text-xs uppercase tracking-wider whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'approvals'
                  ? 'border-[var(--primary)] text-[var(--primary)]'
                  : 'border-transparent text-[var(--gray-400)] hover:text-[var(--foreground)]'
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
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--primary)] border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Leave Balance Tab */}
          {activeTab === 'balance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {balances.map((balance) => (
                <Card hover key={balance.id} className="relative overflow-hidden">
                  <div className="absolute top-0 left-0 h-1.5 w-full bg-[var(--primary)]" />
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <div>
                      <h3 className="text-base font-bold text-[var(--foreground)]">{balance.leave_type?.name}</h3>
                      <p className="text-xs text-[var(--gray-400)] mt-1 font-medium leading-relaxed">{balance.leave_type?.description}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] shrink-0">
                      <Calendar className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="space-y-3 pt-3 border-t border-[var(--gray-50)]">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[var(--gray-400)]">Total Entitled</span>
                      <span className="text-[var(--foreground)]">{balance.total_days} days</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-[var(--gray-400)]">Taken</span>
                      <span className="text-[var(--foreground)]">{balance.used_days} days</span>
                    </div>
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-[var(--foreground)]">Remaining</span>
                        <span className="font-extrabold text-[var(--primary)] text-base">{balance.remaining_days} days</span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Request Leave Tab (Desktop layout) */}
          {activeTab === 'request' && (
            <div className="hidden lg:block">
              <Card className="max-w-full shadow-md">
                <CardHeader title="Submit Leave Request" subtitle="Select your date range and options below." />
                {formContent}
              </Card>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <Card padding="none" className="overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[var(--gray-100)]">
                  <thead className="bg-[var(--gray-25)]">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Leave Type</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Duration</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Days</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3.5 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Requested</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[var(--card-bg)] divide-y divide-[var(--gray-100)]">
                    {requests.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center">
                          <History className="h-10 w-10 text-[var(--gray-300)] mx-auto mb-3" />
                          <p className="text-sm font-bold text-[var(--gray-400)]">No leave history found</p>
                        </td>
                      </tr>
                    ) : (
                      requests.map((request) => (
                        <tr key={request.id} className="hover:bg-[var(--gray-25)] transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-sm font-bold text-[var(--foreground)]">{request.leave_type?.name}</p>
                            {request.reason && (
                              <p className="text-xs text-[var(--gray-400)] mt-0.5 max-w-xs truncate">{request.reason}</p>
                            )}
                            {request.coverup_employee && (
                              <p className="text-xs text-[var(--gray-400)] mt-0.5">
                                Covered by: {request.coverup_employee.first_name} {request.coverup_employee.last_name}
                              </p>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--gray-500)]">
                            {format(new Date(request.start_date), 'MMM dd, yyyy')} - {format(new Date(request.end_date), 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[var(--foreground)]">
                            {request.total_days === 0.5 ? '0.5 day' : `${request.total_days} days`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(request.status)}`}>
                              {getStatusLabel(request.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-[var(--gray-400)]">
                            {format(new Date(request.created_at), 'MMM dd, yyyy')}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* Approvals Tab (HR Only) */}
          {activeTab === 'approvals' && canApprove && (
            <div className="space-y-4 max-w-3xl mx-auto">
              {requests.length === 0 ? (
                <Card className="text-center p-12">
                  <CheckCircle2 className="h-10 w-10 text-[var(--gray-300)] mx-auto mb-3" />
                  <p className="text-sm font-bold text-[var(--gray-400)]">No pending approvals left</p>
                </Card>
              ) : (
                requests.map((request) => (
                  <Card key={request.id} className="relative">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                      <div className="flex-1 space-y-4">
                        {/* Profile Info */}
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] shrink-0">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[var(--foreground)]">
                              {request.user?.first_name} {request.user?.last_name}
                            </p>
                            <p className="text-xs text-[var(--gray-400)] mt-0.5 font-medium">{request.user?.email}</p>
                          </div>
                        </div>

                        {/* Grid Details */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-3.5 bg-[var(--gray-25)] border border-[var(--gray-100)] rounded-xl">
                          <div>
                            <p className="text-[10px] text-[var(--gray-400)] font-bold uppercase tracking-wider mb-0.5">Leave Type</p>
                            <p className="text-xs font-bold text-[var(--foreground)]">{request.leave_type?.name}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[var(--gray-400)] font-bold uppercase tracking-wider mb-0.5">Dates</p>
                            <p className="text-xs font-bold text-[var(--foreground)]">
                              {format(new Date(request.start_date), 'MMM dd')} - {format(new Date(request.end_date), 'MMM dd, yyyy')}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[var(--gray-400)] font-bold uppercase tracking-wider mb-0.5">Requested Days</p>
                            <p className="text-xs font-extrabold text-[var(--primary)]">{request.total_days} days</p>
                          </div>
                          {request.coverup_employee && (
                            <div>
                              <p className="text-[10px] text-[var(--gray-400)] font-bold uppercase tracking-wider mb-0.5">Coverup Employee</p>
                              <p className="text-xs font-bold text-[var(--foreground)]">
                                {request.coverup_employee.first_name} {request.coverup_employee.last_name}
                              </p>
                            </div>
                          )}
                        </div>

                        {request.reason && (
                          <div className="text-xs">
                            <span className="font-bold text-[var(--gray-400)] uppercase tracking-wider block mb-1">Reason</span>
                            <p className="text-[var(--gray-500)] bg-[var(--gray-25)] p-3 rounded-xl border border-[var(--gray-100)] leading-relaxed">{request.reason}</p>
                          </div>
                        )}

                        {request.attachment_url && (
                          <div className="pt-2">
                            <a
                              href={request.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:underline"
                            >
                              <FileSpreadsheet className="h-4 w-4" />
                              <span>View Attachment Doc</span>
                            </a>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(request.status)}`}>
                            {getStatusLabel(request.status)}
                          </span>
                          {request.team_leader_approval_date && (
                            <span className="text-[10px] text-[var(--gray-400)] font-semibold">
                              TL Approved: {format(new Date(request.team_leader_approval_date), 'MMM dd, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex md:flex-col gap-2 shrink-0 justify-end">
                        {request.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApprove(request.id, 'hr')}
                              className="px-4 py-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Please provide a rejection reason:');
                                if (reason) handleReject(request.id, reason);
                              }}
                              className="px-4 py-2 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {request.status === 'team_leader_approved' && (
                          <>
                            <button
                              onClick={() => handleApprove(request.id, 'hr')}
                              className="px-4 py-2 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition-colors cursor-pointer"
                            >
                              Final Approve
                            </button>
                            <button
                              onClick={() => {
                                const reason = prompt('Please provide a rejection reason:');
                                if (reason) handleReject(request.id, reason);
                              }}
                              className="px-4 py-2 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </>
      )}

      {/* Mobile Leave Request Slide-up Sheet */}
      <BottomSheet
        isOpen={isMobileSheetOpen}
        onClose={() => setIsMobileSheetOpen(false)}
        title="Submit Leave Request"
      >
        {formContent}
      </BottomSheet>
    </div>
  );
}
