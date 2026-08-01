'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  FileText, 
  Calendar, 
  Download, 
  Eye, 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  CheckCircle,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

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
      const response = await api.get(`/salaries?year=${year}`);
      const salariesData = response.data.salaries || [];
      
      const salariesWithDetails = await Promise.all(
        salariesData.map(async (salary: Salary) => {
          try {
            const detailResponse = await api.get(`/salaries/${salary.id}`);
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
      const response = await api.get(`/salaries/ytd?year=${year}`);
      setYtdEarnings(response.data);
    } catch (err) {
      console.error('Failed to fetch YTD earnings:', err);
    }
  };

  const downloadPDF = async (salaryId: number) => {
    try {
      const response = await api.get(`/salaries/${salaryId}/pdf`, {
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
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-[var(--primary)] border-t-transparent" />
            <div className="absolute h-6 w-6 rounded-full bg-[var(--primary-light)] animate-ping opacity-75" />
          </div>
          <p className="text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Loading your slips...</p>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.35,
        when: "beforeChildren",
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 pb-12"
    >
      {/* Header section with clean visual hierarchy */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">Salary Slips</h1>
          <p className="text-sm text-[var(--gray-400)] font-medium mt-1">Access salary details, monthly payslips, and tax files.</p>
        </div>
        <div className="flex items-center gap-3 bg-[var(--card-bg)] border border-[var(--gray-100)] p-1.5 rounded-2xl shadow-sm self-start sm:self-center">
          <span className="text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider pl-3 pr-1">Year</span>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="pl-2 pr-8 py-1.5 rounded-xl text-xs font-bold text-[var(--foreground)] bg-transparent focus:outline-none transition-all cursor-pointer border-0 ring-0 outline-none"
          >
            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
              <option key={y} value={y} className="bg-[var(--card-bg)]">
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* YTD Summary Cards */}
      {ytdEarnings && (
        <motion.div variants={itemVariants}>
          <Card padding="md" className="shadow-[var(--shadow-md)] relative overflow-hidden border-[var(--gray-100)]">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)] opacity-[0.02] rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-[var(--secondary)] opacity-[0.02] rounded-full blur-xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-base font-bold text-[var(--foreground)] tracking-tight">Year-to-Date Summary ({year})</h2>
                <p className="text-xs font-medium text-[var(--gray-400)] mt-0.5">Calculated across your generated payslips this year.</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary-ring)] shrink-0 self-start sm:self-center">
                {ytdEarnings.salaryCount || 0} payslips
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-[var(--gray-25)] border border-[var(--gray-50)] rounded-2xl p-5 flex items-start gap-4 hover:shadow-md hover:border-[var(--primary-ring)] transition-all duration-300">
                <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-1">Total Earnings</p>
                  <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    LKR {formatCurrency(ytdEarnings.totalEarnings)}
                  </p>
                </div>
              </div>

              <div className="bg-[var(--gray-25)] border border-[var(--gray-50)] rounded-2xl p-5 flex items-start gap-4 hover:shadow-md hover:border-red-500/10 transition-all duration-300">
                <div className="p-3 bg-red-500/10 text-red-500 dark:text-red-400 rounded-xl shrink-0">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-1">Total Deductions</p>
                  <p className="text-xl font-extrabold text-red-500 dark:text-red-400">
                    LKR {formatCurrency(ytdEarnings.totalDeductions)}
                  </p>
                </div>
              </div>

              <div className="bg-[var(--gray-25)] border border-[var(--gray-50)] rounded-2xl p-5 flex items-start gap-4 hover:shadow-md hover:border-[var(--primary-ring)] transition-all duration-300">
                <div className="p-3 bg-[var(--primary-light)] text-[var(--primary)] rounded-xl shrink-0">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider mb-1">Net Received</p>
                  <p className="text-xl font-extrabold text-[var(--primary)]">
                    LKR {formatCurrency(ytdEarnings.totalNet)}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {error && (
        <div className="bg-[var(--error-light)] border-l-4 border-[var(--error)] text-[var(--error-text)] p-4 rounded-xl text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Salary Listing Section */}
      <motion.div variants={itemVariants}>
        {salaries.length === 0 ? (
          <Card className="text-center p-12 shadow-sm border-[var(--gray-100)]">
            <FileText className="h-10 w-10 text-[var(--gray-300)] mx-auto mb-3" />
            <h3 className="text-sm font-bold text-[var(--foreground)] mb-1">No salary slips found</h3>
            <p className="text-xs text-[var(--gray-400)]">You do not have any salary slips for {year} yet.</p>
          </Card>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Card padding="none" className="overflow-hidden shadow-[var(--shadow-md)] border-[var(--gray-100)]">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-[var(--gray-100)]">
                    <thead className="bg-[var(--gray-25)]">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Month</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Full Salary</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Local Portion</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">International Portion</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">EPF (8%)</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Net Amount</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-[var(--card-bg)] divide-y divide-[var(--gray-100)]">
                      {salaries.map((salary) => {
                        const fullSalary = salary.details?.find(d => d.component_name === 'Full Salary')?.amount || salary.basic_salary || 0;
                        const localSalary = salary.details?.find(d => d.component_name === 'Local Salary')?.amount || 0;
                        const oxoSalary = salary.details?.find(d => d.component_name === 'OXO International Salary')?.amount || 0;
                        const epfDeduction = salary.details?.find(d => d.component_name === 'Provident Fund' && d.type === 'deduction')?.amount || salary.total_deductions || 0;
                        
                        const isPaid = salary.status === 'paid';
                        const isGenerated = salary.status === 'generated';

                        return (
                          <tr key={salary.id} className="hover:bg-[var(--gray-25)] transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-[var(--primary-light)] text-[var(--primary)] rounded-xl">
                                  <Calendar className="h-4 w-4" />
                                </div>
                                <span className="text-sm font-bold text-[var(--foreground)]">
                                  {format(new Date(salary.month_year), 'MMMM yyyy')}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[var(--gray-600)]">
                              LKR {formatCurrency(fullSalary)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              LKR {formatCurrency(localSalary)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-emerald-600 dark:text-emerald-400">
                              LKR {formatCurrency(oxoSalary)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-red-500 dark:text-red-400">
                                  LKR {formatCurrency(epfDeduction)}
                                </span>
                                <span className="text-[10px] text-[var(--gray-400)] font-semibold mt-0.5">
                                  (8% of Local)
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-[var(--foreground)]">
                              LKR {formatCurrency(salary.net_salary)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                  isPaid
                                    ? 'bg-[var(--success-light)] text-[var(--success-text)] border border-[var(--success-text)]/10'
                                    : isGenerated
                                    ? 'bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary-ring)]'
                                    : 'bg-[var(--warning-light)] text-[var(--warning-text)] border border-[var(--warning-text)]/10'
                                }`}
                              >
                                {salary.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <Link
                                  href={`/salary/slips/${salary.id}`}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>View</span>
                                </Link>
                                <button
                                  onClick={() => downloadPDF(salary.id)}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                                >
                                  <Download className="h-3.5 w-3.5" />
                                  <span>Download</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Mobile Card / Wallet View - Native App Feel */}
            <div className="md:hidden flex flex-col gap-4">
              {salaries.map((salary) => {
                const fullSalary = salary.details?.find(d => d.component_name === 'Full Salary')?.amount || salary.basic_salary || 0;
                const localSalary = salary.details?.find(d => d.component_name === 'Local Salary')?.amount || 0;
                const oxoSalary = salary.details?.find(d => d.component_name === 'OXO International Salary')?.amount || 0;
                const epfDeduction = salary.details?.find(d => d.component_name === 'Provident Fund' && d.type === 'deduction')?.amount || salary.total_deductions || 0;
                
                const isPaid = salary.status === 'paid';
                const isGenerated = salary.status === 'generated';

                return (
                  <Card key={salary.id} padding="md" className="shadow-sm hover:shadow-md border-[var(--gray-100)] flex flex-col gap-4">
                    {/* Month & Status Badge */}
                    <div className="flex justify-between items-center pb-3 border-b border-[var(--gray-50)]">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-[var(--primary-light)] text-[var(--primary)] rounded-xl">
                          <Calendar className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-bold text-[var(--foreground)]">
                          {format(new Date(salary.month_year), 'MMMM yyyy')}
                        </span>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                          isPaid
                            ? 'bg-[var(--success-light)] text-[var(--success-text)]'
                            : isGenerated
                            ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                            : 'bg-[var(--warning-light)] text-[var(--warning-text)]'
                        }`}
                      >
                        {salary.status}
                      </span>
                    </div>

                    {/* Financial details grid */}
                    <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-xs">
                      <div>
                        <p className="text-[10px] font-semibold text-[var(--gray-400)] mb-0.5">Full Salary</p>
                        <p className="font-semibold text-[var(--gray-600)]">LKR {formatCurrency(fullSalary)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-[var(--gray-400)] mb-0.5">Net Pay</p>
                        <p className="font-extrabold text-[var(--foreground)]">LKR {formatCurrency(salary.net_salary)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-[var(--gray-400)] mb-0.5">Local Portion</p>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">LKR {formatCurrency(localSalary)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold text-[var(--gray-400)] mb-0.5">Int'l Portion</p>
                        <p className="font-bold text-emerald-600 dark:text-emerald-400">LKR {formatCurrency(oxoSalary)}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[10px] font-semibold text-[var(--gray-400)] mb-0.5">EPF Deduction (8%)</p>
                        <p className="font-bold text-red-500 dark:text-red-400">LKR {formatCurrency(epfDeduction)} <span className="text-[10px] font-normal text-[var(--gray-400)]">(8% of local)</span></p>
                      </div>
                    </div>

                    {/* Bottom Action buttons */}
                    <div className="flex gap-2 pt-2 border-t border-[var(--gray-50)]">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs py-2 hover:bg-[var(--gray-25)] cursor-pointer"
                        leftIcon={<Eye className="h-3.5 w-3.5" />}
                        onClick={() => window.location.href = `/salary/slips/${salary.id}`}
                      >
                        View Slip
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        className="flex-1 text-xs py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white cursor-pointer"
                        leftIcon={<Download className="h-3.5 w-3.5" />}
                        onClick={() => downloadPDF(salary.id)}
                      >
                        Download
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
