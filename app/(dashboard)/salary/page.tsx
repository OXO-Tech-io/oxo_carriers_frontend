'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import Link from 'next/link';
import { DocumentTextIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface Salary {
  id: number;
  month_year: string;
  basic_salary: number;
  total_earnings: number;
  total_deductions: number;
  net_salary: number;
  status: 'generated' | 'paid' | 'pending';
  pdf_url?: string;
  created_at: string;
  details?: SalaryDetail[];
}

interface SalaryDetail {
  id: number;
  component_id: number;
  amount: number;
  type: 'earning' | 'deduction';
  component_name?: string;
  component_type?: string;
}

// Helper function to format numbers with thousand separators
const formatCurrency = (value: number | string | undefined): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : (value || 0);
  return numValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export default function SalaryPage() {
  const { user } = useAuth();
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [ytdEarnings, setYtdEarnings] = useState<any>(null);

  useEffect(() => {
    fetchSalaries();
    fetchYTD();
  }, [year]);

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/salary?year=${year}`);
      const salariesData = response.data.salaries || [];
      
      // Fetch details for each salary to get component breakdown
      const salariesWithDetails = await Promise.all(
        salariesData.map(async (salary: Salary) => {
          try {
            const detailResponse = await api.get(`/salary/${salary.id}`);
            return {
              ...salary,
              details: detailResponse.data.details || []
            };
          } catch {
            return salary;
          }
        })
      );
      
      setSalaries(salariesWithDetails);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch salaries');
      setSalaries([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchYTD = async () => {
    try {
      const response = await api.get(`/salary/ytd?year=${year}`);
      setYtdEarnings(response.data);
    } catch (err) {
      console.error('Failed to fetch YTD earnings:', err);
    }
  };

  const downloadPDF = async (salaryId: number) => {
    try {
      const response = await api.get(`/salary/${salaryId}/pdf`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `salary-slip-${salaryId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to download PDF');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          <p className="text-sm text-gray-600">Loading salary slips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Salary Slips</h1>
          <p className="mt-2 text-gray-600">View and download your salary slips</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm hover:shadow-md"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {ytdEarnings && (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Year-to-Date Summary ({year})</h2>
            <div className="px-3 py-1 bg-blue-100 rounded-full">
              <span className="text-sm font-semibold text-blue-700">
                {ytdEarnings.salaryCount || 0} Slips
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-white/50">
              <p className="text-sm font-medium text-gray-600 mb-2">Total Earnings</p>
              <p className="text-2xl font-bold text-emerald-600">
                LKR {formatCurrency(ytdEarnings.totalEarnings)}
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-white/50">
              <p className="text-sm font-medium text-gray-600 mb-2">Total Deductions</p>
              <p className="text-2xl font-bold text-red-600">
                LKR {formatCurrency(ytdEarnings.totalDeductions)}
              </p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border border-white/50">
              <p className="text-sm font-medium text-gray-600 mb-2">Net Salary</p>
              <p className="text-2xl font-bold text-blue-600">
                LKR {formatCurrency(ytdEarnings.totalNet)}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {salaries.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <DocumentTextIcon className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No salary slips found</h3>
          <p className="text-gray-600">You don't have any salary slips for {year} yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Full Salary
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Local Salary
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    OXO International
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    EPF (8%)
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Net Salary
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {salaries.map((salary) => {
                  // Extract component amounts from details
                  const fullSalary = salary.details?.find(d => d.component_name === 'Full Salary')?.amount || salary.basic_salary || 0;
                  const localSalary = salary.details?.find(d => d.component_name === 'Local Salary')?.amount || 0;
                  const oxoSalary = salary.details?.find(d => d.component_name === 'OXO International Salary')?.amount || 0;
                  const epfDeduction = salary.details?.find(d => d.component_name === 'Provident Fund' && d.type === 'deduction')?.amount || salary.total_deductions || 0;
                  
                  return (
                    <tr key={salary.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 p-2 rounded-lg bg-blue-50">
                            <CalendarIcon className="h-5 w-5 text-blue-600" />
                          </div>
                          <span className="text-sm font-semibold text-gray-900">
                            {format(new Date(salary.month_year), 'MMMM yyyy')}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          LKR {formatCurrency(fullSalary)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-emerald-600">
                          LKR {formatCurrency(localSalary)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-emerald-600">
                          LKR {formatCurrency(oxoSalary)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-red-600">
                            LKR {formatCurrency(epfDeduction)}
                          </span>
                          <span className="text-xs text-gray-500">
                            (8% of Local)
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-base font-bold text-gray-900">
                          LKR {formatCurrency(salary.net_salary)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                          salary.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : salary.status === 'generated'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {salary.status.charAt(0).toUpperCase() + salary.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <Link
                          href={`/salary/slips/${salary.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => downloadPDF(salary.id)}
                          className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                          Download
                        </button>
                      </div>
                    </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
