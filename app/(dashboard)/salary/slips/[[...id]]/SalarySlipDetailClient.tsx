'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { format } from 'date-fns';
import { ArrowLeft, Download } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';

// Helper function to format currency with thousand separators
const formatCurrency = (value: number | string | undefined): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : (value || 0);
  return numValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

interface SalarySlipDetail {
  id: number;
  component_id: number;
  amount: number;
  type: 'earning' | 'deduction';
  component_name?: string;
  component_type?: string;
}

interface Salary {
  id: number;
  user_id: number;
  month_year: string;
  basic_salary: number;
  total_earnings: number;
  total_deductions: number;
  net_salary: number;
  status: 'generated' | 'paid' | 'pending';
  pdf_url?: string;
  created_at: string;
}

export default function SalarySlipDetailClient() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [salary, setSalary] = useState<Salary | null>(null);
  const [details, setDetails] = useState<SalarySlipDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Handle both [id] and [...id] route formats
    const salaryId = Array.isArray(params.id) ? params.id[0] : params.id;
    if (salaryId) {
      fetchSalarySlip(salaryId);
    }
  }, [params.id]);

  const fetchSalarySlip = async (id?: string | string[]) => {
    const salaryId = id || (Array.isArray(params.id) ? params.id[0] : params.id);
    if (!salaryId) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/salary/${salaryId}`);
      setSalary(response.data.salary);
      setDetails(response.data.details || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch salary slip');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = async () => {
    if (!salary) return;
    
    try {
      const response = await api.get(`/salary/${salary.id}/pdf`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `salary-slip-${salary.id}.pdf`);
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
          <p className="text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Loading details...</p>
        </div>
      </div>
    );
  }

  if (error || !salary) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-semibold text-[var(--gray-500)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="bg-[var(--error-light)] border border-[var(--error-text)]/10 text-[var(--error-text)] px-4 py-3 rounded-xl text-sm font-medium">
          {error || 'Salary slip not found'}
        </div>
      </div>
    );
  }

  const earnings = details.filter(d => d.type === 'earning');
  const deductions = details.filter(d => d.type === 'deduction');
  
  // Extract specific salary components
  const fullSalary = details.find(d => d.component_name === 'Full Salary')?.amount || 0;
  const localSalary = Number(details.find(d => d.component_name === 'Local Salary')?.amount || 0);
  const oxoInternationalSalary = details.find(d => d.component_name === 'OXO International Salary')?.amount || 0;
  const epfDeduction = Number(details.find(d => d.component_name === 'Provident Fund' && d.type === 'deduction')?.amount || 0);
  const allowances = Number(details.find(d => d.component_name === 'Allowances' && d.type === 'earning')?.amount || 0);
  const salaryAdvanceDeductions = Number(details.find(d => d.component_name === 'Salary Advance/Deductions' && d.type === 'deduction')?.amount || 0);
  
  // Calculate local and foreign earnings/deductions
  const localEarnings = localSalary + allowances; // Local salary + allowances
  const foreignEarnings = oxoInternationalSalary;
  const totalDeductions = salary?.total_deductions || (epfDeduction + salaryAdvanceDeductions);
  const localDeductions = totalDeductions; // All deductions are local
  const foreignDeductions = 0; // No deductions for foreign remittance typically
  
  const netLocalPay = localEarnings - localDeductions;
  const netForeignPay = foreignEarnings - foreignDeductions;
  const monthlyTotalNetPay = netLocalPay + netForeignPay;

  return (
    <div className="space-y-6 pb-12">
      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--gray-500)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Salary Slips
        </button>
        <Button
          onClick={downloadPDF}
          className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-sm flex items-center justify-center cursor-pointer"
          leftIcon={<Download className="h-4 w-4" />}
        >
          Download PDF
        </Button>
      </div>

      {/* Salary Slip Document - Wrapped inside Scrollable Card */}
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="min-w-[620pt] md:min-w-0 bg-white p-8 sm:p-12 rounded-2xl shadow-[var(--shadow-lg)] border border-[var(--gray-100)] mx-auto my-2" style={{ maxWidth: '600pt' }}>
          {/* Logo */}
          <div className="flex justify-end items-center" style={{ textAlign: 'left', marginBottom: '8pt' }}>
            <div style={{ display: 'inline-block', width: '106px', height: '59.14px', border: '0px solid #000000' }}>
              <Image
                src="/logo.png"
                alt="OXO International Logo"
                width={106}
                height={59}
                style={{ width: '106px', height: '59.14px', objectFit: 'contain' }}
              />
            </div>
          </div>

          {/* Company Header */}
          <div style={{ textAlign: 'center', paddingTop: '0pt', paddingBottom: '8pt', lineHeight: 1.158 }}>
            <p style={{ margin: 0, fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>
              OXO International FZE
            </p>
            <p style={{ margin: 0, fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000', marginTop: '4pt' }}>
              Business Centre, Sharjah Publishing City Free Zone, Sharjah,UAE.,<br />
              E-mail: mahen@oxoholdings.biz Web: <a href="http://www.oxointernational.com" style={{ color: '#0563c1', textDecoration: 'underline' }}>www.oxointernational.com</a>
            </p>
          </div>

          {/* Pay Slip Month */}
          <div style={{ textAlign: 'center', paddingTop: '0pt', paddingBottom: '8pt', lineHeight: 1.158 }}>
            <p style={{ margin: 0, fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '12pt', color: '#000000' }}>
              Pay slip for the month of {format(new Date(salary.month_year), 'MMMM yyyy')}
            </p>
          </div>

          {/* Employee Information Table */}
          <table style={{ borderSpacing: 0, borderCollapse: 'collapse', width: '100%', marginBottom: '8pt' }}>
            <tbody>
              <tr style={{ height: '0pt' }}>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '50%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.4, textAlign: 'left' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Employee ID : {user?.employee_id}</span>
                  </p>
                  <p style={{ margin: 0, lineHeight: 1.4, textAlign: 'left' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Employee Name : {user?.first_name} {user?.last_name}</span>
                  </p>
                  <p style={{ margin: 0, lineHeight: 1.4, textAlign: 'left' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Designation : {user?.position || 'N/A'}</span>
                  </p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '50%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.4, textAlign: 'left' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Bank :</span>
                    <span>&nbsp;</span>
                  </p>
                  <p style={{ margin: 0, lineHeight: 1.4, textAlign: 'left' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Branch :</span>
                    <span style={{ fontFamily: 'Calibri, sans-serif', fontSize: '11pt' }}>&nbsp;</span>
                  </p>
                  <p style={{ margin: 0, lineHeight: 1.4, textAlign: 'left' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Account No :</span>
                    <span style={{ fontFamily: 'Calibri, sans-serif', fontSize: '11pt' }}>&nbsp;</span>
                  </p>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Local Remittance Section */}
          <table style={{ borderSpacing: 0, borderCollapse: 'collapse', width: '100%', marginBottom: '8pt' }}>
            <tbody>
              <tr style={{ height: '0pt' }}>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '100%', verticalAlign: 'top', backgroundColor: '#f9fafb' }} colSpan={4}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'left' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Local Remittance</span>
                  </p>
                </td>
              </tr>
              <tr style={{ height: '0pt' }}>
                <td style={{ border: '1pt solid #000000', padding: '4pt 8pt', width: '50%', verticalAlign: 'top', backgroundColor: '#f3f4f6' }} colSpan={2}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'center' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Earnings</span>
                  </p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '4pt 8pt', width: '50%', verticalAlign: 'top', backgroundColor: '#f3f4f6' }} colSpan={2}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'center' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Deductions</span>
                  </p>
                </td>
              </tr>
              <tr style={{ height: '0pt' }}>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'left' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Basic Salary</span>
                  </p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>LKR {formatCurrency(localSalary)}</span>
                  </p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'left' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Loans/Advances</span>
                  </p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>
                      {salaryAdvanceDeductions > 0 ? `LKR ${formatCurrency(salaryAdvanceDeductions)}` : 'N/A'}
                    </span>
                  </p>
                </td>
              </tr>
              <tr style={{ height: '0pt' }}>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'left' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Allowances</span>
                  </p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>
                      {allowances > 0 ? `LKR ${formatCurrency(allowances)}` : 'N/A'}
                    </span>
                  </p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'left' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>EPF 8%</span>
                  </p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>LKR {formatCurrency(epfDeduction)}</span>
                  </p>
                </td>
              </tr>
              <tr style={{ height: '0pt' }}>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'left' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Arrears</span>
                  </p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>N/A</span>
                  </p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'left' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Other Deductions</span>
                  </p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>N/A</span>
                  </p>
                </td>
              </tr>
              <tr style={{ height: '0pt' }}>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top', fontWeight: 700 }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'left' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Gross Salary</span>
                  </p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>LKR {formatCurrency(localEarnings)}</span>
                  </p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top', fontWeight: 700 }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'left' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Total Deductions</span>
                  </p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>
                      LKR {formatCurrency(totalDeductions)}
                    </span> 
                  </p>
                </td>
              </tr>
              <tr style={{ height: '0pt' }}>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top', backgroundColor: '#f9fafb' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'left' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Net Local Pay </span>
                  </p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '75%', verticalAlign: 'top', backgroundColor: '#f9fafb' }} colSpan={3}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>LKR {formatCurrency(netLocalPay)}</span>
                  </p>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Foreign Remittance Section */}
          <table style={{ borderSpacing: 0, borderCollapse: 'collapse', width: '100%', marginBottom: '8pt' }}>
            <tbody>
              <tr style={{ height: '0pt' }}>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '100%', verticalAlign: 'top', backgroundColor: '#f9fafb' }} colSpan={4}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'left' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Foreign Remittance</span>
                  </p>
                </td>
              </tr>
              <tr style={{ height: '0pt' }}>
                <td style={{ border: '1pt solid #000000', padding: '4pt 8pt', width: '50%', verticalAlign: 'top', backgroundColor: '#f3f4f6' }} colSpan={2}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'center' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Earnings</span>
                  </p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '4pt 8pt', width: '50%', verticalAlign: 'top', backgroundColor: '#f3f4f6' }} colSpan={2}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'center' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Deductions</span>
                  </p>
                </td>
              </tr>
              <tr style={{ height: '0pt' }}>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'left' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Basic Salary</span>
                  </p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>LKR {formatCurrency(oxoInternationalSalary)}</span>
                  </p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'left' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Loans/Advances</span>
                  </p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>N/A</span>
                  </p>
                </td>
              </tr>
              <tr style={{ height: '0pt' }}>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'left' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Allowances (Fixed)</span>
                  </p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>N/A</span>
                  </p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'left' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Other Deductions</span>
                  </p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>N/A</span>
                  </p>
                </td>
              </tr>
              <tr style={{ height: '0pt' }}>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'left' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Allowances (Variable) </span>
                  </p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>N/A</span>
                  </p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'left' }}>&nbsp;</p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>N/A</span>
                  </p>
                </td>
              </tr>
              <tr style={{ height: '0pt' }}>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'left' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Arrears</span>
                  </p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>N/A</span>
                  </p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'left' }}>&nbsp;</p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>N/A</span>
                  </p>
                </td>
              </tr>
              <tr style={{ height: '0pt' }}>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top', fontWeight: 700 }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'left' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>OXO International Salary</span>
                  </p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>LKR {formatCurrency(oxoInternationalSalary)}</span>
                  </p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top', fontWeight: 700 }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'left' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Total Deductions</span>
                  </p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>LKR {formatCurrency(foreignDeductions)}</span>
                  </p>
                </td>
              </tr>
              <tr style={{ height: '0pt' }}>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top', backgroundColor: '#f9fafb' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'left' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Net Foreign Pay </span>
                  </p>
                </td>
                <td style={{ border: '1pt solid #000000', padding: '6pt 8pt', width: '75%', verticalAlign: 'top', backgroundColor: '#f9fafb' }} colSpan={3}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>LKR {formatCurrency(netForeignPay)}</span>
                  </p>
                </td>
              </tr>
              <tr style={{ height: '0pt' }}>
                <td style={{ border: '1.5pt solid #000000', padding: '6pt 8pt', width: '25%', verticalAlign: 'top', backgroundColor: '#f3f4f6' }}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'left' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Monthly Total Net Pay</span>
                  </p>
                </td>
                <td style={{ border: '1.5pt solid #000000', padding: '6pt 8pt', width: '75%', verticalAlign: 'top', backgroundColor: '#f3f4f6' }} colSpan={3}>
                  <p style={{ margin: 0, lineHeight: 1.0, textAlign: 'right' }}>
                    <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11.5pt', color: '#000000' }}>LKR {formatCurrency(monthlyTotalNetPay)}</span>
                  </p>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Signature Section */}
          <div className="flex justify-end items-center" style={{ paddingTop: '0pt', paddingBottom: '8pt', lineHeight: 1.158, textAlign: 'left', marginTop: '24pt' }}>
            <div style={{ display: 'inline-block', width: '160px', height: '160px', border: '0px solid #000000' }}>
              <Image
                src="/seal.png"
                alt="OXO International Seal"
                width={160}
                height={160}
                style={{ width: '160px', height: '160px', objectFit: 'contain' }}
              />
            </div>
          </div>

          {/* Footer */}
          <div style={{ paddingTop: '8pt', borderTop: '0.5pt solid #e5e7eb', paddingBottom: '0pt', lineHeight: 1.0, textAlign: 'left', marginTop: '16pt' }}>
            <p style={{ margin: 0 }}>
              <span style={{ fontFamily: 'Calibri, sans-serif', fontSize: '10pt', color: '#6b7280' }}>OXO International FZE — Confidential Salary Document</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
