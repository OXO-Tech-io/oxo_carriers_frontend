'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { ChartBarIcon, DocumentTextIcon, CalendarIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

// Helper function to format currency with thousand separators
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
  const { user, isHR } = useAuth();
  const [activeTab, setActiveTab] = useState<'salary' | 'leave' | 'summary'>('summary');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  
  const [salaryReport, setSalaryReport] = useState<SalaryReport | null>(null);
  const [leaveReport, setLeaveReport] = useState<LeaveReport | null>(null);

  useEffect(() => {
    if (isHR) {
      fetchReports();
    }
  }, [selectedYear, selectedMonth, isHR]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch salary report
      const salaryParams = new URLSearchParams({
        year: selectedYear.toString(),
        ...(selectedMonth && { month: selectedMonth.toString() })
      });
      const salaryRes = await api.get(`/salary?${salaryParams}`);
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
      const requests = leaveRes.data.requests || [];

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

  if (!isHR) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[#101828]">Reports</h1>
        <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-12 text-center">
          <p className="text-sm text-[#475467]">You don't have permission to view reports.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#101828]">Reports</h1>
          <p className="text-sm text-[#475467] mt-1">View salary and leave reports</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#344054] mb-2">Year</label>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              min={2020}
              max={new Date().getFullYear() + 1}
              className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#344054] mb-2">Month (Optional)</label>
            <select
              value={selectedMonth || ''}
              onChange={(e) => setSelectedMonth(e.target.value ? parseInt(e.target.value) : null)}
              className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm font-medium text-[#344054] bg-white focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
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
          <div className="flex items-end">
            <button
              onClick={fetchReports}
              className="w-full px-4 py-2.5 text-sm font-semibold text-white bg-[#465FFF] rounded-lg hover:bg-[#3641F5] transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E4E7EC]">
        <nav className="flex space-x-8">
          {[
            { id: 'summary', label: 'Summary', icon: ChartBarIcon },
            { id: 'salary', label: 'Salary Reports', icon: DocumentTextIcon },
            { id: 'leave', label: 'Leave Reports', icon: CalendarIcon }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-[#465FFF] text-[#465FFF]'
                    : 'border-transparent text-[#475467] hover:text-[#344054] hover:border-[#D0D5DD]'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-12 text-center">
          <p className="text-sm text-[#475467]">Loading reports...</p>
        </div>
      ) : error ? (
        <div className="bg-[#FEE4E2] border border-[#FCA5A5] rounded-lg p-4">
          <p className="text-sm font-semibold text-[#991B1B]">{error}</p>
        </div>
      ) : (
        <>
          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#475467]">Total Salaries</p>
                    <p className="text-2xl font-bold text-[#101828] mt-1">
                      {salaryReport?.totalSalaries || 0}
                    </p>
                  </div>
                  <DocumentTextIcon className="h-8 w-8 text-[#465FFF]" />
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#475467]">Total Net Salary</p>
                    <p className="text-2xl font-bold text-[#101828] mt-1">
                      LKR {formatCurrency(salaryReport?.totalNetSalary)}
                    </p>
                  </div>
                  <ChartBarIcon className="h-8 w-8 text-[#10B981]" />
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#475467]">Leave Requests</p>
                    <p className="text-2xl font-bold text-[#101828] mt-1">
                      {leaveReport?.totalRequests || 0}
                    </p>
                  </div>
                  <CalendarIcon className="h-8 w-8 text-[#F59E0B]" />
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-[#475467]">Pending Approvals</p>
                    <p className="text-2xl font-bold text-[#101828] mt-1">
                      {leaveReport?.pending || 0}
                    </p>
                  </div>
                  <UserGroupIcon className="h-8 w-8 text-[#EF4444]" />
                </div>
              </div>
            </div>
          )}

          {/* Salary Reports Tab */}
          {activeTab === 'salary' && salaryReport && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-6">
                  <p className="text-sm text-[#475467]">Total Earnings</p>
                  <p className="text-2xl font-bold text-[#101828] mt-1">
                    LKR {formatCurrency(salaryReport.totalEarnings)}
                  </p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-6">
                  <p className="text-sm text-[#475467]">Total Deductions</p>
                  <p className="text-2xl font-bold text-[#101828] mt-1">
                    LKR {formatCurrency(salaryReport.totalDeductions)}
                  </p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-6">
                  <p className="text-sm text-[#475467]">Average Salary</p>
                  <p className="text-2xl font-bold text-[#101828] mt-1">
                    LKR {formatCurrency(salaryReport.averageSalary)}
                  </p>
                </div>
              </div>

              {salaryReport.byDepartment.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] overflow-hidden">
                  <div className="p-6 border-b border-[#E4E7EC]">
                    <h2 className="text-lg font-bold text-[#101828]">Salary by Department</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-[#E4E7EC]">
                      <thead className="bg-[#F9FAFB]">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase">Department</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase">Count</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase">Total Salary</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-[#E4E7EC]">
                        {salaryReport.byDepartment.map((dept, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#101828]">{dept.department}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475467]">{dept.count}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475467]">
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-6">
                  <p className="text-sm text-[#475467]">Total Requests</p>
                  <p className="text-2xl font-bold text-[#101828] mt-1">{leaveReport.totalRequests}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-6">
                  <p className="text-sm text-[#475467]">Approved</p>
                  <p className="text-2xl font-bold text-[#10B981] mt-1">{leaveReport.approved}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-6">
                  <p className="text-sm text-[#475467]">Pending</p>
                  <p className="text-2xl font-bold text-[#F59E0B] mt-1">{leaveReport.pending}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-6">
                  <p className="text-sm text-[#475467]">Rejected</p>
                  <p className="text-2xl font-bold text-[#EF4444] mt-1">{leaveReport.rejected}</p>
                </div>
              </div>

              {leaveReport.byType.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] overflow-hidden">
                  <div className="p-6 border-b border-[#E4E7EC]">
                    <h2 className="text-lg font-bold text-[#101828]">Leave Requests by Type</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-[#E4E7EC]">
                      <thead className="bg-[#F9FAFB]">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase">Leave Type</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase">Requests</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase">Total Days</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-[#E4E7EC]">
                        {leaveReport.byType.map((type, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#101828]">{type.leave_type}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475467]">{type.count}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475467]">{type.total_days} days</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
