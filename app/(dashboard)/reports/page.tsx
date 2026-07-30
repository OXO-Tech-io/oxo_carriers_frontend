'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import {
  reportsService,
  SubmissionBreakdownData,
} from '@/lib/services/reports.service';
import {
  ChartBarIcon,
  DocumentTextIcon,
  CalendarIcon,
  UserGroupIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  ChatBubbleBottomCenterTextIcon,
  ClipboardDocumentCheckIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

const formatCurrency = (value: number | string | undefined): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : (value || 0);
  return numValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

interface SalaryReport {
  totalSalaries: number;
  totalEarnings: number;
  totalDeductions: number;
  totalNetSalary: number;
  averageSalary: number;
  byDepartment: Array<{
    department: string;
    count: number;
    total: number;
  }>;
}

interface LeaveReport {
  totalRequests: number;
  approved: number;
  pending: number;
  rejected: number;
  byType: Array<{
    leave_type: string;
    count: number;
    total_days: number;
  }>;
}

export default function ReportsPage() {
  const { user, isHR, isSuperAdmin } = useAuth();
  const canAccess = isHR || isSuperAdmin;

  const [activeTab, setActiveTab] = useState<'submissions' | 'summary' | 'salary' | 'leave'>('submissions');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Year/Month filters for salary/leaves
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  // Enhanced Filters for Submissions & Compliance Breakdown
  const [subEmployeeId, setSubEmployeeId] = useState('');
  const [subFormId, setSubFormId] = useState('');
  const [subCommId, setSubCommId] = useState('');
  const [subDepartment, setSubDepartment] = useState('');
  const [subStatus, setSubStatus] = useState('all');
  const [subStartDate, setSubStartDate] = useState('');
  const [subEndDate, setSubEndDate] = useState('');
  const [subSearch, setSubSearch] = useState('');
  const [subSectionView, setSubSectionView] = useState<'all' | 'forms' | 'communications' | 'users'>('all');

  const [salaryReport, setSalaryReport] = useState<SalaryReport | null>(null);
  const [leaveReport, setLeaveReport] = useState<LeaveReport | null>(null);
  const [submissionData, setSubmissionData] = useState<SubmissionBreakdownData | null>(null);

  const [exportingLeaves, setExportingLeaves] = useState(false);
  const [exportingSalary, setExportingSalary] = useState(false);
  const [exportingSubmissions, setExportingSubmissions] = useState(false);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportLeavesExcel = async () => {
    setExportingLeaves(true);
    setError('');
    try {
      const blob = await reportsService.downloadLeavesReport({
        year: selectedYear,
        ...(selectedMonth && { month: selectedMonth }),
      } as any);
      const yearMonth = selectedMonth ? `${selectedYear}-${String(selectedMonth).padStart(2, '0')}` : String(selectedYear);
      downloadBlob(blob, `leave-report-${yearMonth}.xlsx`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to export leaves Excel');
    } finally {
      setExportingLeaves(false);
    }
  };

  const handleExportSalaryExcel = async () => {
    setExportingSalary(true);
    setError('');
    try {
      const blob = await reportsService.downloadSalariesReport({
        year: selectedYear,
        ...(selectedMonth && { month: selectedMonth }),
      } as any);
      const yearMonth = selectedMonth ? `${selectedYear}-${String(selectedMonth).padStart(2, '0')}` : String(selectedYear);
      downloadBlob(blob, `salary-report-${yearMonth}.xlsx`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to export salary Excel');
    } finally {
      setExportingSalary(false);
    }
  };

  const handleExportSubmissionsExcel = async () => {
    setExportingSubmissions(true);
    setError('');
    try {
      const blob = await reportsService.downloadSubmissionsBreakdownExcel({
        employeeId: subEmployeeId || undefined,
        formId: subFormId ? Number(subFormId) : undefined,
        communicationId: subCommId ? Number(subCommId) : undefined,
        department: subDepartment || undefined,
        status: subStatus !== 'all' ? subStatus : undefined,
        startDate: subStartDate || undefined,
        endDate: subEndDate || undefined,
        search: subSearch || undefined,
      });
      const dateStr = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `submissions-compliance-report-${dateStr}.xlsx`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to export submissions compliance Excel');
    } finally {
      setExportingSubmissions(false);
    }
  };

  useEffect(() => {
    if (isHR || isSuperAdmin) {
      if (activeTab === 'submissions') {
        fetchSubmissionsBreakdown();
      } else {
        fetchReports();
      }
    }
  }, [selectedYear, selectedMonth, activeTab, isHR, isSuperAdmin]);

  const fetchSubmissionsBreakdown = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await reportsService.getSubmissionsBreakdown({
        employeeId: subEmployeeId || undefined,
        formId: subFormId ? Number(subFormId) : undefined,
        communicationId: subCommId ? Number(subCommId) : undefined,
        department: subDepartment || undefined,
        status: subStatus !== 'all' ? subStatus : undefined,
        startDate: subStartDate || undefined,
        endDate: subEndDate || undefined,
        search: subSearch || undefined,
      });
      setSubmissionData(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch submission breakdown');
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch salary report
      const salaryParams = new URLSearchParams({
        year: selectedYear.toString(),
        ...(selectedMonth && { month: selectedMonth.toString() })
      });
      const salaryRes = await api.get(`/salaries?${salaryParams}`);
      const salaries = salaryRes.data.salaries || [];

      const salaryData: SalaryReport = {
        totalSalaries: salaries.length,
        totalEarnings: salaries.reduce((sum: number, s: any) => sum + (s.total_earnings || 0), 0),
        totalDeductions: salaries.reduce((sum: number, s: any) => sum + (s.total_deductions || 0), 0),
        totalNetSalary: salaries.reduce((sum: number, s: any) => sum + (s.net_salary || 0), 0),
        averageSalary: salaries.length > 0 
          ? salaries.reduce((sum: number, s: any) => sum + (s.net_salary || 0), 0) / salaries.length 
          : 0,
        byDepartment: []
      };

      // Group by department
      const deptMap = new Map<string, { count: number; total: number }>();
      salaries.forEach((s: any) => {
        const dept = s.department || 'Unknown';
        const existing = deptMap.get(dept) || { count: 0, total: 0 };
        deptMap.set(dept, {
          count: existing.count + 1,
          total: existing.total + (s.net_salary || 0)
        });
      });
      salaryData.byDepartment = Array.from(deptMap.entries()).map(([department, data]) => ({
        department,
        ...data
      }));

      setSalaryReport(salaryData);

      // Fetch leave report
      const leaveParams = new URLSearchParams({
        ...(selectedYear && { year: selectedYear.toString() }),
        ...(selectedMonth && { month: selectedMonth.toString() })
      });
      const leaveRes = await api.get(`/leaves?${leaveParams}`);
      const requests = leaveRes.data.data || [];

      const leaveData: LeaveReport = {
        totalRequests: requests.length,
        approved: requests.filter((r: any) => r.status === 'hr_approved').length,
        pending: requests.filter((r: any) => r.status === 'pending' || r.status === 'team_leader_approved').length,
        rejected: requests.filter((r: any) => r.status === 'rejected').length,
        byType: []
      };

      // Group by leave type
      const typeMap = new Map<string, { count: number; total_days: number }>();
      requests.forEach((r: any) => {
        const typeName = r.leave_type?.name || 'Unknown';
        const existing = typeMap.get(typeName) || { count: 0, total_days: 0 };
        typeMap.set(typeName, {
          count: existing.count + 1,
          total_days: existing.total_days + (r.total_days || 0)
        });
      });
      leaveData.byType = Array.from(typeMap.entries()).map(([leave_type, data]) => ({
        leave_type,
        ...data
      }));

      setLeaveReport(leaveData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const renderStatusBadge = (status: 'on_time' | 'late' | 'overdue' | 'pending') => {
    switch (status) {
      case 'on_time':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--success-light)] text-[var(--success-text)] border border-[var(--success-light)]">
            <CheckCircleIcon className="w-3.5 h-3.5 text-[var(--success)]" />
            On Time
          </span>
        );
      case 'late':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--warning-light)] text-[var(--warning-text)] border border-[var(--warning-light)]">
            <ClockIcon className="w-3.5 h-3.5 text-[var(--warning)]" />
            Late Submitted
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--error-light)] text-[var(--error-text)] border border-[var(--error-light)]">
            <ExclamationCircleIcon className="w-3.5 h-3.5 text-[var(--error)]" />
            Overdue
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--info-light)] text-[var(--info-text)] border border-[var(--info-light)]">
            <ClockIcon className="w-3.5 h-3.5 text-[var(--info)]" />
            Pending
          </span>
        );
    }
  };

  if (!canAccess) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Reports</h1>
        <div className="bg-[var(--card-bg)] rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--gray-100)] p-12 text-center">
          <p className="text-sm text-[var(--gray-500)]">You don't have permission to view reports.</p>
        </div>
      </div>
    );
  }

  const selectedEmployeeInfo = submissionData?.filterOptions?.employees?.find(
    (e) => e.employeeId === subEmployeeId
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Reports & Analytics</h1>
          <p className="text-sm text-[var(--gray-400)] mt-1">
            Monitor submission compliance, form responses, communications, salary, and leaves.
          </p>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="border-b border-[var(--gray-100)]">
        <nav className="flex space-x-8 overflow-x-auto">
          {[
            { id: 'submissions', label: 'Submissions & Compliance Breakdown', icon: ClipboardDocumentCheckIcon },
            { id: 'summary', label: 'Executive Summary', icon: ChartBarIcon },
            { id: 'salary', label: 'Salary Reports', icon: DocumentTextIcon },
            { id: 'leave', label: 'Leave Reports', icon: CalendarIcon }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-semibold text-sm transition-colors flex items-center space-x-2 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-[var(--primary)] text-[var(--primary)]'
                    : 'border-transparent text-[var(--gray-400)] hover:text-[var(--gray-700)] hover:border-[var(--gray-200)]'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Submissions & Compliance Breakdown Tab */}
      {activeTab === 'submissions' && (
        <div className="space-y-6">
          {/* Enhanced Multi-Criteria Filtration Panel */}
          <div className="bg-[var(--card-bg)] rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--gray-100)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                <FunnelIcon className="h-5 w-5 text-[var(--primary)]" />
                Filter Submissions & Communications
              </h2>
              <button
                onClick={() => {
                  setSubEmployeeId('');
                  setSubFormId('');
                  setSubCommId('');
                  setSubDepartment('');
                  setSubStatus('all');
                  setSubStartDate('');
                  setSubEndDate('');
                  setSubSearch('');
                  fetchSubmissionsBreakdown();
                }}
                className="text-xs font-semibold text-[var(--primary)] hover:underline"
              >
                Reset All Filters
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Employee / User Select Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-[var(--gray-700)] mb-1.5 flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5 text-[var(--primary)]" />
                  Employee / Individual User
                </label>
                <select
                  value={subEmployeeId}
                  onChange={(e) => setSubEmployeeId(e.target.value)}
                  className="block w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg text-sm text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option value="">All Employees / Users</option>
                  {submissionData?.filterOptions?.employees?.map((emp) => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.employeeName} ({emp.employeeId}) - {emp.department}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Specific Form Select Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-[var(--gray-700)] mb-1.5 flex items-center gap-1">
                  <DocumentTextIcon className="w-3.5 h-3.5 text-[var(--primary)]" />
                  Specific Form
                </label>
                <select
                  value={subFormId}
                  onChange={(e) => setSubFormId(e.target.value)}
                  className="block w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg text-sm text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option value="">All Forms</option>
                  {submissionData?.filterOptions?.forms?.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Specific Communication Select Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-[var(--gray-700)] mb-1.5 flex items-center gap-1">
                  <ChatBubbleBottomCenterTextIcon className="w-3.5 h-3.5 text-[var(--primary)]" />
                  Specific Communication
                </label>
                <select
                  value={subCommId}
                  onChange={(e) => setSubCommId(e.target.value)}
                  className="block w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg text-sm text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option value="">All Communications</option>
                  {submissionData?.filterOptions?.communications?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Department Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-[var(--gray-700)] mb-1.5">Department</label>
                <select
                  value={subDepartment}
                  onChange={(e) => setSubDepartment(e.target.value)}
                  className="block w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg text-sm text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option value="">All Departments</option>
                  {submissionData?.filterOptions?.departments?.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Status Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-[var(--gray-700)] mb-1.5">Submission Status</label>
                <select
                  value={subStatus}
                  onChange={(e) => setSubStatus(e.target.value)}
                  className="block w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg text-sm text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option value="all">All Statuses</option>
                  <option value="on_time">On Time</option>
                  <option value="late">Late Submitted</option>
                  <option value="overdue">Overdue</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* 6. Start Date */}
              <div>
                <label className="block text-xs font-semibold text-[var(--gray-700)] mb-1.5">From Date</label>
                <input
                  type="date"
                  value={subStartDate}
                  onChange={(e) => setSubStartDate(e.target.value)}
                  className="block w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--card-bg)]"
                />
              </div>

              {/* 7. End Date */}
              <div>
                <label className="block text-xs font-semibold text-[var(--gray-700)] mb-1.5">To Date</label>
                <input
                  type="date"
                  value={subEndDate}
                  onChange={(e) => setSubEndDate(e.target.value)}
                  className="block w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--card-bg)]"
                />
              </div>

              {/* 8. Search Box */}
              <div>
                <label className="block text-xs font-semibold text-[var(--gray-700)] mb-1.5">Search Keywords</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search name, ID, or title..."
                    value={subSearch}
                    onChange={(e) => setSubSearch(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2 border border-[var(--gray-200)] rounded-lg text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] bg-[var(--card-bg)]"
                  />
                  <MagnifyingGlassIcon className="h-4 w-4 text-[var(--gray-400)] absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--gray-100)]">
              <button
                onClick={fetchSubmissionsBreakdown}
                className="px-5 py-2 text-sm font-semibold text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)] transition-colors shadow-xs"
              >
                Apply Filters
              </button>

              <button
                onClick={handleExportSubmissionsExcel}
                disabled={exportingSubmissions}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[var(--gray-700)] bg-[var(--card-bg)] border border-[var(--gray-200)] rounded-lg hover:bg-[var(--gray-50)] transition-colors disabled:opacity-50"
              >
                <ArrowDownTrayIcon className="h-4 w-4 text-[var(--primary)]" />
                {exportingSubmissions ? 'Exporting...' : 'Export Filtered Excel Report'}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="bg-[var(--card-bg)] rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--gray-100)] p-12 text-center">
              <p className="text-sm text-[var(--gray-500)]">Loading submission & compliance breakdown...</p>
            </div>
          ) : error ? (
            <div className="bg-[var(--error-light)] border border-[var(--error-light)] rounded-lg p-4">
              <p className="text-sm font-semibold text-[var(--error-text)]">{error}</p>
            </div>
          ) : submissionData ? (
            <>
              {/* Selected Individual User Spotlight Banner (if an individual user is selected in the filter) */}
              {subEmployeeId && selectedEmployeeInfo && (
                <div className="bg-[var(--card-bg)] rounded-2xl p-6 shadow-[var(--shadow-md)] border border-[var(--gray-100)]">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-[var(--primary-light)] border border-[var(--gray-100)] flex items-center justify-center font-bold text-xl text-[var(--primary)]">
                        {selectedEmployeeInfo.employeeName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-bold text-[var(--foreground)]">{selectedEmployeeInfo.employeeName}</h3>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--gray-100)]">
                            {selectedEmployeeInfo.employeeId}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--gray-500)] mt-1">
                          Department: <span className="font-semibold text-[var(--foreground)]">{selectedEmployeeInfo.department}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs font-semibold text-[var(--gray-400)] uppercase tracking-wider">User Compliance Score</p>
                        <p className="text-3xl font-extrabold text-[var(--success-text)] mt-1">
                          {submissionData.summary.overallComplianceRate}%
                        </p>
                      </div>

                      <button
                        onClick={() => setSubEmployeeId('')}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--gray-50)] text-[var(--gray-700)] border border-[var(--gray-200)] hover:bg-[var(--gray-100)] transition-colors"
                      >
                        Clear User Filter
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* High-level Compliance Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Overall Compliance */}
                <div className="bg-[var(--card-bg)] rounded-2xl p-6 shadow-[var(--shadow)] border border-[var(--gray-100)] relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)]">
                        Overall Compliance Rate
                      </p>
                      <p className="text-3xl font-extrabold text-[var(--foreground)] mt-2">
                        {submissionData.summary.overallComplianceRate}%
                      </p>
                    </div>
                    <div className="p-3 bg-[var(--primary-light)] rounded-xl">
                      <ClipboardDocumentCheckIcon className="w-8 h-8 text-[var(--primary)]" />
                    </div>
                  </div>
                  <p className="text-xs text-[var(--gray-400)] mt-3">
                    {subEmployeeId ? `Compliance rate for ${selectedEmployeeInfo?.employeeName || subEmployeeId}` : 'Overall on-time submission percentage across selected filters.'}
                  </p>
                </div>

                {/* Forms Submission Stats */}
                <div className="bg-[var(--card-bg)] rounded-2xl p-6 shadow-[var(--shadow)] border border-[var(--gray-100)]">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)]">
                        Forms On-Time Rate
                      </p>
                      <p className="text-3xl font-extrabold text-[var(--foreground)] mt-2">
                        {submissionData.summary.forms.onTimePercentage}%
                      </p>
                    </div>
                    <div className="p-3 bg-[var(--success-light)] rounded-xl">
                      <DocumentTextIcon className="w-6 h-6 text-[var(--success)]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-[var(--gray-100)] text-center">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[var(--gray-400)]">Assigned</p>
                      <p className="text-sm font-bold text-[var(--foreground)]">{submissionData.summary.forms.totalAssigned}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[var(--success-text)]">On Time</p>
                      <p className="text-sm font-bold text-[var(--success-text)]">{submissionData.summary.forms.onTimeCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[var(--warning-text)]">Late</p>
                      <p className="text-sm font-bold text-[var(--warning-text)]">{submissionData.summary.forms.lateCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[var(--error-text)]">Overdue</p>
                      <p className="text-sm font-bold text-[var(--error-text)]">{submissionData.summary.forms.overdueCount}</p>
                    </div>
                  </div>
                </div>

                {/* Communications Stats */}
                <div className="bg-[var(--card-bg)] rounded-2xl p-6 shadow-[var(--shadow)] border border-[var(--gray-100)]">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-400)]">
                        Communications On-Time Rate
                      </p>
                      <p className="text-3xl font-extrabold text-[var(--foreground)] mt-2">
                        {submissionData.summary.communications.onTimePercentage}%
                      </p>
                    </div>
                    <div className="p-3 bg-[var(--info-light)] rounded-xl">
                      <ChatBubbleBottomCenterTextIcon className="w-6 h-6 text-[var(--info)]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mt-4 pt-3 border-t border-[var(--gray-100)] text-center">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[var(--gray-400)]">Recipients</p>
                      <p className="text-sm font-bold text-[var(--foreground)]">{submissionData.summary.communications.totalRecipients}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[var(--success-text)]">On Time</p>
                      <p className="text-sm font-bold text-[var(--success-text)]">{submissionData.summary.communications.onTimeCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[var(--warning-text)]">Late</p>
                      <p className="text-sm font-bold text-[var(--warning-text)]">{submissionData.summary.communications.lateCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold text-[var(--error-text)]">Overdue</p>
                      <p className="text-sm font-bold text-[var(--error-text)]">{submissionData.summary.communications.overdueCount}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-view switcher buttons */}
              <div className="flex items-center gap-2 border-b border-[var(--gray-100)] pb-2">
                {[
                  { id: 'all', label: `All Breakdown Sections` },
                  { id: 'forms', label: `Forms Breakdown (${submissionData.formsBreakdown.length})` },
                  { id: 'communications', label: `Communications Breakdown (${submissionData.communicationsBreakdown.length})` },
                  { id: 'users', label: `Individual Users Summary (${submissionData.userBreakdown.length})` },
                ].map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => setSubSectionView(sec.id as any)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      subSectionView === sec.id
                        ? 'bg-[var(--primary)] text-white shadow-xs'
                        : 'bg-[var(--card-bg)] border border-[var(--gray-200)] text-[var(--gray-700)] hover:bg-[var(--gray-50)]'
                    }`}
                  >
                    {sec.label}
                  </button>
                ))}
              </div>

              {/* Section 1: Forms Submission Breakdown */}
              {(subSectionView === 'all' || subSectionView === 'forms') && (
                <div className="bg-[var(--card-bg)] rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--gray-100)] overflow-hidden">
                  <div className="p-5 border-b border-[var(--gray-100)] flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                        <DocumentTextIcon className="h-5 w-5 text-[var(--primary)]" />
                        Forms Submission Breakdown
                      </h2>
                      <p className="text-xs text-[var(--gray-400)] mt-0.5">
                        Individual form assignments showing submission timestamp and on-time vs late status.
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[var(--gray-500)] bg-[var(--gray-50)] px-2.5 py-1 rounded-full border border-[var(--gray-100)]">
                      {submissionData.formsBreakdown.length} Records
                    </span>
                  </div>

                  {submissionData.formsBreakdown.length === 0 ? (
                    <div className="p-8 text-center text-sm text-[var(--gray-400)]">
                      No form submissions found matching the selected filters.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-[var(--gray-100)]">
                        <thead className="bg-[var(--gray-50)]">
                          <tr>
                            <th className="px-5 py-3.5 text-left text-xs font-bold text-[var(--gray-500)] uppercase">Employee</th>
                            <th className="px-5 py-3.5 text-left text-xs font-bold text-[var(--gray-500)] uppercase">Department</th>
                            <th className="px-5 py-3.5 text-left text-xs font-bold text-[var(--gray-500)] uppercase">Form Title</th>
                            <th className="px-5 py-3.5 text-left text-xs font-bold text-[var(--gray-500)] uppercase">Distributed</th>
                            <th className="px-5 py-3.5 text-left text-xs font-bold text-[var(--gray-500)] uppercase">Deadline</th>
                            <th className="px-5 py-3.5 text-left text-xs font-bold text-[var(--gray-500)] uppercase">Submitted At</th>
                            <th className="px-5 py-3.5 text-left text-xs font-bold text-[var(--gray-500)] uppercase">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-[var(--card-bg)] divide-y divide-[var(--gray-100)]">
                          {submissionData.formsBreakdown.map((row) => (
                            <tr key={row.distributionId} className="hover:bg-[var(--gray-50)] transition-colors">
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-[var(--foreground)]">{row.employeeName}</div>
                                <div className="text-xs text-[var(--gray-400)]">{row.employeeId}</div>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-sm text-[var(--gray-500)]">
                                {row.department}
                              </td>
                              <td className="px-5 py-4 text-sm font-semibold text-[var(--foreground)]">
                                {row.formTitle}
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-xs text-[var(--gray-500)]">
                                {row.distributedAt ? new Date(row.distributedAt).toLocaleString() : '-'}
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-xs text-[var(--gray-500)]">
                                {row.deadlineAt ? (
                                  <span className="font-semibold text-[var(--foreground)]">
                                    {new Date(row.deadlineAt).toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="text-[var(--gray-400)]">No Deadline</span>
                                )}
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-xs text-[var(--gray-500)]">
                                {row.submittedAt ? (
                                  new Date(row.submittedAt).toLocaleString()
                                ) : (
                                  <span className="text-[var(--gray-400)] font-medium">Not Submitted</span>
                                )}
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                {renderStatusBadge(row.status)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Section 2: Communications Breakdown */}
              {(subSectionView === 'all' || subSectionView === 'communications') && (
                <div className="bg-[var(--card-bg)] rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--gray-100)] overflow-hidden">
                  <div className="p-5 border-b border-[var(--gray-100)] flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                        <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-[var(--primary)]" />
                        Communications Acknowledgment Breakdown
                      </h2>
                      <p className="text-xs text-[var(--gray-400)] mt-0.5">
                        Individual recipient acknowledgments showing response text and on-time vs late status.
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[var(--gray-500)] bg-[var(--gray-50)] px-2.5 py-1 rounded-full border border-[var(--gray-100)]">
                      {submissionData.communicationsBreakdown.length} Records
                    </span>
                  </div>

                  {submissionData.communicationsBreakdown.length === 0 ? (
                    <div className="p-8 text-center text-sm text-[var(--gray-400)]">
                      No communication records found matching the selected filters.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-[var(--gray-100)]">
                        <thead className="bg-[var(--gray-50)]">
                          <tr>
                            <th className="px-5 py-3.5 text-left text-xs font-bold text-[var(--gray-500)] uppercase">Recipient</th>
                            <th className="px-5 py-3.5 text-left text-xs font-bold text-[var(--gray-500)] uppercase">Department</th>
                            <th className="px-5 py-3.5 text-left text-xs font-bold text-[var(--gray-500)] uppercase">Communication Title</th>
                            <th className="px-5 py-3.5 text-left text-xs font-bold text-[var(--gray-500)] uppercase">Email Sent</th>
                            <th className="px-5 py-3.5 text-left text-xs font-bold text-[var(--gray-500)] uppercase">Deadline</th>
                            <th className="px-5 py-3.5 text-left text-xs font-bold text-[var(--gray-500)] uppercase">Responded At</th>
                            <th className="px-5 py-3.5 text-left text-xs font-bold text-[var(--gray-500)] uppercase">Status</th>
                            <th className="px-5 py-3.5 text-left text-xs font-bold text-[var(--gray-500)] uppercase">Response Text</th>
                          </tr>
                        </thead>
                        <tbody className="bg-[var(--card-bg)] divide-y divide-[var(--gray-100)]">
                          {submissionData.communicationsBreakdown.map((row) => (
                            <tr key={row.recipientId} className="hover:bg-[var(--gray-50)] transition-colors">
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-[var(--foreground)]">{row.employeeName}</div>
                                <div className="text-xs text-[var(--gray-400)]">{row.employeeId}</div>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-sm text-[var(--gray-500)]">
                                {row.department}
                              </td>
                              <td className="px-5 py-4 text-sm font-semibold text-[var(--foreground)]">
                                {row.communicationTitle}
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-xs text-[var(--gray-500)]">
                                {row.emailSentAt ? new Date(row.emailSentAt).toLocaleString() : '-'}
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-xs text-[var(--gray-500)]">
                                {row.deadlineAt ? (
                                  <span className="font-semibold text-[var(--foreground)]">
                                    {new Date(row.deadlineAt).toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="text-[var(--gray-400)]">No Deadline</span>
                                )}
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-xs text-[var(--gray-500)]">
                                {row.respondedAt ? (
                                  new Date(row.respondedAt).toLocaleString()
                                ) : (
                                  <span className="text-[var(--gray-400)] font-medium">Not Responded</span>
                                )}
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                {renderStatusBadge(row.status)}
                              </td>
                              <td className="px-5 py-4 text-xs text-[var(--foreground)]">
                                {row.responseText ? (
                                  <span className="italic bg-[var(--gray-50)] px-2 py-1 rounded border border-[var(--gray-200)]">
                                    "{row.responseText}"
                                  </span>
                                ) : (
                                  <span className="text-[var(--gray-400)]">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Section 3: Individual User Compliance Summary */}
              {(subSectionView === 'all' || subSectionView === 'users') && (
                <div className="bg-[var(--card-bg)] rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--gray-100)] overflow-hidden">
                  <div className="p-5 border-b border-[var(--gray-100)] flex items-center justify-between">
                    <div>
                      <h2 className="text-base font-bold text-[var(--foreground)] flex items-center gap-2">
                        <UserGroupIcon className="h-5 w-5 text-[var(--primary)]" />
                        Individual User Compliance Summary
                      </h2>
                      <p className="text-xs text-[var(--gray-400)] mt-0.5">
                        Submission compliance rate aggregated per individual employee. Click any employee to filter down.
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-[var(--gray-500)] bg-[var(--gray-50)] px-2.5 py-1 rounded-full border border-[var(--gray-100)]">
                      {submissionData.userBreakdown.length} Employees
                    </span>
                  </div>

                  {submissionData.userBreakdown.length === 0 ? (
                    <div className="p-8 text-center text-sm text-[var(--gray-400)]">
                      No user records found matching the selected filters.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-[var(--gray-100)]">
                        <thead className="bg-[var(--gray-50)]">
                          <tr>
                            <th className="px-5 py-3.5 text-left text-xs font-bold text-[var(--gray-500)] uppercase">Employee</th>
                            <th className="px-5 py-3.5 text-left text-xs font-bold text-[var(--gray-500)] uppercase">Department</th>
                            <th className="px-5 py-3.5 text-left text-xs font-bold text-[var(--gray-500)] uppercase">Forms Breakdown</th>
                            <th className="px-5 py-3.5 text-left text-xs font-bold text-[var(--gray-500)] uppercase">Communications Breakdown</th>
                            <th className="px-5 py-3.5 text-left text-xs font-bold text-[var(--gray-500)] uppercase">Compliance Rate</th>
                            <th className="px-5 py-3.5 text-[var(--gray-500)]"></th>
                          </tr>
                        </thead>
                        <tbody className="bg-[var(--card-bg)] divide-y divide-[var(--gray-100)]">
                          {submissionData.userBreakdown.map((row) => (
                            <tr key={row.employeeId} className="hover:bg-[var(--gray-50)] transition-colors">
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-[var(--foreground)]">{row.employeeName}</div>
                                <div className="text-xs text-[var(--gray-400)]">{row.employeeId}</div>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-sm text-[var(--gray-500)]">
                                {row.department}
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-[var(--success-text)]">{row.forms.onTime} On-Time</span>
                                  <span className="text-[var(--gray-300)]">/</span>
                                  <span className="font-semibold text-[var(--warning-text)]">{row.forms.late} Late</span>
                                  <span className="text-[var(--gray-300)]">/</span>
                                  <span className="font-semibold text-[var(--error-text)]">{row.forms.overdue} Overdue</span>
                                </div>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-[var(--success-text)]">{row.communications.onTime} On-Time</span>
                                  <span className="text-[var(--gray-300)]">/</span>
                                  <span className="font-semibold text-[var(--warning-text)]">{row.communications.late} Late</span>
                                  <span className="text-[var(--gray-300)]">/</span>
                                  <span className="font-semibold text-[var(--error-text)]">{row.communications.overdue} Overdue</span>
                                </div>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="w-24 bg-[var(--gray-100)] h-2 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        row.complianceRate >= 80
                                          ? 'bg-[var(--success)]'
                                          : row.complianceRate >= 50
                                          ? 'bg-[var(--warning)]'
                                          : 'bg-[var(--error)]'
                                      }`}
                                      style={{ width: `${row.complianceRate}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold text-[var(--foreground)]">
                                    {row.complianceRate}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-right">
                                <button
                                  onClick={() => setSubEmployeeId(row.employeeId)}
                                  className="text-xs font-semibold text-[var(--primary)] hover:underline"
                                >
                                  Filter User
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : null}
        </div>
      )}

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[var(--card-bg)] rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--gray-100)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--gray-500)]">Total Salaries</p>
                <p className="text-2xl font-bold text-[var(--foreground)] mt-1">
                  {salaryReport?.totalSalaries || 0}
                </p>
              </div>
              <DocumentTextIcon className="h-8 w-8 text-[var(--primary)]" />
            </div>
          </div>
          <div className="bg-[var(--card-bg)] rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--gray-100)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--gray-500)]">Total Net Salary</p>
                <p className="text-2xl font-bold text-[var(--foreground)] mt-1">
                  LKR {formatCurrency(salaryReport?.totalNetSalary)}
                </p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-[var(--success)]" />
            </div>
          </div>
          <div className="bg-[var(--card-bg)] rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--gray-100)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--gray-500)]">Leave Requests</p>
                <p className="text-2xl font-bold text-[var(--foreground)] mt-1">
                  {leaveReport?.totalRequests || 0}
                </p>
              </div>
              <CalendarIcon className="h-8 w-8 text-[var(--warning)]" />
            </div>
          </div>
          <div className="bg-[var(--card-bg)] rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--gray-100)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--gray-500)]">Pending Approvals</p>
                <p className="text-2xl font-bold text-[var(--foreground)] mt-1">
                  {leaveReport?.pending || 0}
                </p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-[var(--error)]" />
            </div>
          </div>
        </div>
      )}

      {/* Salary Reports Tab */}
      {activeTab === 'salary' && salaryReport && (
        <div className="space-y-6">
          <div className="bg-[var(--card-bg)] rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--gray-100)] p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--gray-700)] mb-2">Year</label>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  min={2020}
                  max={new Date().getFullYear() + 1}
                  className="block w-full px-3 py-2.5 border border-[var(--gray-200)] rounded-lg text-sm text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--gray-700)] mb-2">Month (Optional)</label>
                <select
                  value={selectedMonth || ''}
                  onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : null)}
                  className="block w-full px-3 py-2.5 border border-[var(--gray-200)] rounded-lg text-sm font-medium text-[var(--gray-700)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option value="">All Months</option>
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>
              <div className="flex items-end gap-2 flex-wrap">
                <button
                  onClick={fetchReports}
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                >
                  Refresh
                </button>
                <button
                  onClick={handleExportSalaryExcel}
                  disabled={exportingSalary}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[var(--gray-700)] bg-[var(--card-bg)] border border-[var(--gray-200)] rounded-lg hover:bg-[var(--gray-50)] transition-colors disabled:opacity-50"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  {exportingSalary ? 'Exporting...' : 'Export Salary (Excel)'}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[var(--card-bg)] rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--gray-100)] p-6">
              <p className="text-sm text-[var(--gray-500)]">Total Earnings</p>
              <p className="text-2xl font-bold text-[var(--foreground)] mt-1">
                LKR {formatCurrency(salaryReport.totalEarnings)}
              </p>
            </div>
            <div className="bg-[var(--card-bg)] rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--gray-100)] p-6">
              <p className="text-sm text-[var(--gray-500)]">Total Deductions</p>
              <p className="text-2xl font-bold text-[var(--foreground)] mt-1">
                LKR {formatCurrency(salaryReport.totalDeductions)}
              </p>
            </div>
            <div className="bg-[var(--card-bg)] rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--gray-100)] p-6">
              <p className="text-sm text-[var(--gray-500)]">Average Salary</p>
              <p className="text-2xl font-bold text-[var(--foreground)] mt-1">
                LKR {formatCurrency(salaryReport.averageSalary)}
              </p>
            </div>
          </div>

          {salaryReport.byDepartment.length > 0 && (
            <div className="bg-[var(--card-bg)] rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--gray-100)] overflow-hidden">
              <div className="p-6 border-b border-[var(--gray-100)]">
                <h2 className="text-lg font-bold text-[var(--foreground)]">Salary by Department</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[var(--gray-100)]">
                  <thead className="bg-[var(--gray-50)]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-500)] uppercase">Department</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-500)] uppercase">Count</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-500)] uppercase">Total Salary</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[var(--card-bg)] divide-y divide-[var(--gray-100)]">
                    {salaryReport.byDepartment.map((dept, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[var(--foreground)]">{dept.department}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--gray-500)]">{dept.count}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--gray-500)]">
                          LKR {formatCurrency(dept.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leave Reports Tab */}
      {activeTab === 'leave' && leaveReport && (
        <div className="space-y-6">
          <div className="bg-[var(--card-bg)] rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--gray-100)] p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--gray-700)] mb-2">Year</label>
                <input
                  type="number"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  min={2020}
                  max={new Date().getFullYear() + 1}
                  className="block w-full px-3 py-2.5 border border-[var(--gray-200)] rounded-lg text-sm text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--gray-700)] mb-2">Month (Optional)</label>
                <select
                  value={selectedMonth || ''}
                  onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : null)}
                  className="block w-full px-3 py-2.5 border border-[var(--gray-200)] rounded-lg text-sm font-medium text-[var(--gray-700)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option value="">All Months</option>
                  <option value="1">January</option>
                  <option value="2">February</option>
                  <option value="3">March</option>
                  <option value="4">April</option>
                  <option value="5">May</option>
                  <option value="6">June</option>
                  <option value="7">July</option>
                  <option value="8">August</option>
                  <option value="9">September</option>
                  <option value="10">October</option>
                  <option value="11">November</option>
                  <option value="12">December</option>
                </select>
              </div>
              <div className="flex items-end gap-2 flex-wrap">
                <button
                  onClick={fetchReports}
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-[var(--primary)] rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
                >
                  Refresh
                </button>
                <button
                  onClick={handleExportLeavesExcel}
                  disabled={exportingLeaves}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-[var(--gray-700)] bg-[var(--card-bg)] border border-[var(--gray-200)] rounded-lg hover:bg-[var(--gray-50)] transition-colors disabled:opacity-50"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  {exportingLeaves ? 'Exporting...' : 'Export Leaves (Excel)'}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[var(--card-bg)] rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--gray-100)] p-6">
              <p className="text-sm text-[var(--gray-500)]">Total Requests</p>
              <p className="text-2xl font-bold text-[var(--foreground)] mt-1">{leaveReport.totalRequests}</p>
            </div>
            <div className="bg-[var(--card-bg)] rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--gray-100)] p-6">
              <p className="text-sm text-[var(--gray-500)]">Approved</p>
              <p className="text-2xl font-bold text-[var(--success-text)] mt-1">{leaveReport.approved}</p>
            </div>
            <div className="bg-[var(--card-bg)] rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--gray-100)] p-6">
              <p className="text-sm text-[var(--gray-500)]">Pending</p>
              <p className="text-2xl font-bold text-[var(--warning-text)] mt-1">{leaveReport.pending}</p>
            </div>
            <div className="bg-[var(--card-bg)] rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--gray-100)] p-6">
              <p className="text-sm text-[var(--gray-500)]">Rejected</p>
              <p className="text-2xl font-bold text-[var(--error-text)] mt-1">{leaveReport.rejected}</p>
            </div>
          </div>

          {leaveReport.byType.length > 0 && (
            <div className="bg-[var(--card-bg)] rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--gray-100)] overflow-hidden">
              <div className="p-6 border-b border-[var(--gray-100)]">
                <h2 className="text-lg font-bold text-[var(--foreground)]">Leave Requests by Type</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[var(--gray-100)]">
                  <thead className="bg-[var(--gray-50)]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-500)] uppercase">Leave Type</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-500)] uppercase">Requests</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-500)] uppercase">Total Days</th>
                    </tr>
                  </thead>
                  <tbody className="bg-[var(--card-bg)] divide-y divide-[var(--gray-100)]">
                    {leaveReport.byType.map((type, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[var(--foreground)]">{type.leave_type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--gray-500)]">{type.count}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--gray-500)]">{type.total_days} days</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
