'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { format } from 'date-fns';
import { ArrowLeftIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';

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

export default function SalarySlipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [salary, setSalary] = useState<Salary | null>(null);
  const [details, setDetails] = useState<SalarySlipDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchSalarySlip();
    }
  }, [params.id]);

  const fetchSalarySlip = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/salary/${params.id}`);
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
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !salary) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back
        </button>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Salary slip not found'}
        </div>
      </div>
    );
  }

  const earnings = details.filter(d => d.type === 'earning');
  const deductions = details.filter(d => d.type === 'deduction');
  
  // Extract specific salary components
  const fullSalary = details.find(d => d.component_name === 'Full Salary')?.amount || 0;
  const localSalary = details.find(d => d.component_name === 'Local Salary')?.amount || 0;
  const oxoInternationalSalary = details.find(d => d.component_name === 'OXO International Salary')?.amount || 0;
  const epfDeduction = details.find(d => d.component_name === 'Provident Fund' && d.type === 'deduction')?.amount || 0;
  
  // Calculate local and foreign earnings/deductions
  const localEarnings = localSalary;
  const foreignEarnings = oxoInternationalSalary;
  const localDeductions = epfDeduction; // EPF is 8% of local salary
  const foreignDeductions = 0; // No deductions for foreign remittance typically
  
  const netLocalPay = localEarnings - localDeductions;
  const netForeignPay = foreignEarnings - foreignDeductions;
  const monthlyTotalNetPay = netLocalPay + netForeignPay;

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Salary Slips
        </button>
        <button
          onClick={downloadPDF}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
          Download PDF
        </button>
      </div>

      {/* Salary Slip Document - Exact HTML Structure */}
      <div style={{ backgroundColor: '#ffffff', maxWidth: '600pt', margin: '0 auto' }}>
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
        <table style={{ marginLeft: '8.8pt', borderSpacing: 0, borderCollapse: 'collapse', marginRight: 'auto', width: '100%', marginBottom: '8pt' }}>
          <tbody>
            <tr style={{ height: '0pt' }}>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '224.9pt', verticalAlign: 'top' }} colSpan={2}>
                <p style={{ margin: 0, paddingTop: '0pt', paddingBottom: '0pt', lineHeight: 1.0, textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Employee ID :</span>
                </p>
                <p style={{ margin: 0, paddingTop: '0pt', paddingBottom: '0pt', lineHeight: 1.0, textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Employee Name : {user?.first_name} {user?.last_name}</span>
                </p>
                <p style={{ margin: 0, paddingTop: '0pt', paddingBottom: '0pt', lineHeight: 1.0, textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Designation : {user?.position || 'N/A'}</span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '233.8pt', verticalAlign: 'top' }} colSpan={2}>
                <p style={{ margin: 0, paddingTop: '0pt', paddingBottom: '0pt', lineHeight: 1.0, textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Bank :</span>
                  <span>&nbsp;</span>
                </p>
                <p style={{ margin: 0, paddingTop: '0pt', paddingBottom: '0pt', lineHeight: 1.0, textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Branch :</span>
                  <span style={{ fontFamily: 'Calibri, sans-serif', fontSize: '11pt' }}>&nbsp;</span>
                </p>
                <p style={{ margin: 0, paddingTop: '0pt', paddingBottom: '0pt', lineHeight: 1.0, textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Account No :</span>
                  <span style={{ fontFamily: 'Calibri, sans-serif', fontSize: '11pt' }}>&nbsp;</span>
                </p>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Local Remittance Section */}
        <table style={{ marginLeft: '8.8pt', borderSpacing: 0, borderCollapse: 'collapse', marginRight: 'auto', width: '100%', marginBottom: '8pt' }}>
          <tbody>
            <tr style={{ height: '0pt' }}>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '458.8pt', verticalAlign: 'top' }} colSpan={4}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Local Remittance</span>
                </p>
              </td>
            </tr>
            <tr style={{ height: '0pt' }}>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '224.9pt', verticalAlign: 'top' }} colSpan={2}>
                <p style={{ margin: 0, paddingTop: '0pt', paddingBottom: '0pt', lineHeight: 1.0, textAlign: 'center' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Earnings</span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '233.8pt', verticalAlign: 'top' }} colSpan={2}>
                <p style={{ margin: 0, paddingTop: '0pt', paddingBottom: '0pt', lineHeight: 1.0, textAlign: 'center' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Deductions</span>
                </p>
              </td>
            </tr>
            <tr style={{ height: '0pt' }}>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '108.1pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Basic Salary</span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '116.8pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'right' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>LKR {formatCurrency(localSalary)}</span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '116.9pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Loans/Advances</span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '116.9pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'right' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>N/A</span>
                </p>
              </td>
            </tr>
            <tr style={{ height: '0pt' }}>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '108.1pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Allowances (Fixed)</span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '116.8pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'right' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>N/A</span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '116.9pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>EPF 8%</span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '116.9pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'right' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>LKR {formatCurrency(epfDeduction)}</span>
                </p>
              </td>
            </tr>
            <tr style={{ height: '0pt' }}>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '108.1pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Allowances (Variable) </span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '116.8pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'right' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>N/A</span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '116.9pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Taxes</span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '116.9pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'right' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>N/A</span>
                </p>
              </td>
            </tr>
            <tr style={{ height: '0pt' }}>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '108.1pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Arrears</span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '116.8pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'right' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>N/A</span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '116.9pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Other Deductions</span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '116.9pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'right' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>N/A</span>
                </p>
              </td>
            </tr>
            <tr style={{ height: '0pt' }}>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '108.1pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Gross Salary</span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '116.8pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'right' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>LKR {formatCurrency(localSalary)}</span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '116.9pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Total Deductions</span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '116.9pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'right' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>LKR {formatCurrency(epfDeduction)}</span>
                </p>
              </td>
            </tr>
            <tr style={{ height: '0pt' }}>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '108.1pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Net Local Pay </span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '350.6pt', verticalAlign: 'top' }} colSpan={3}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'right' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>LKR {formatCurrency(netLocalPay)}</span>
                </p>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Foreign Remittance Section */}
        <table style={{ marginLeft: '8.8pt', borderSpacing: 0, borderCollapse: 'collapse', marginRight: 'auto', width: '100%', marginBottom: '8pt' }}>
          <tbody>
            <tr style={{ height: '0pt' }}>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '458.8pt', verticalAlign: 'top' }} colSpan={4}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Foreign Remittance</span>
                </p>
              </td>
            </tr>
            <tr style={{ height: '0pt' }}>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '224.9pt', verticalAlign: 'top' }} colSpan={2}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'center' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Earnings</span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '233.8pt', verticalAlign: 'top' }} colSpan={2}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'center' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Deductions</span>
                </p>
              </td>
            </tr>
            <tr style={{ height: '0pt' }}>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '108.1pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Basic Salary</span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '116.8pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'right' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>LKR {formatCurrency(oxoInternationalSalary)}</span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '116.9pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Loans/Advances</span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '116.9pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'right' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>N/A</span>
                </p>
              </td>
            </tr>
            <tr style={{ height: '0pt' }}>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '108.1pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Allowances (Fixed)</span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '116.8pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'right' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>N/A</span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '116.9pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Other Deductions</span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '116.9pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'right' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>N/A</span>
                </p>
              </td>
            </tr>
            <tr style={{ height: '0pt' }}>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '108.1pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Allowances (Variable) </span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '116.8pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'right' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>N/A</span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '116.9pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'left', height: '12pt' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}></span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '116.9pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'right' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>N/A</span>
                </p>
              </td>
            </tr>
            <tr style={{ height: '0pt' }}>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '108.1pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Arrears</span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '116.8pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'right' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>N/A</span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '116.9pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'left', height: '12pt' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}></span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '116.9pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'right' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>N/A</span>
                </p>
              </td>
            </tr>
            <tr style={{ height: '0pt' }}>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '108.1pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Gross Salary</span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '116.8pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'right' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>LKR {formatCurrency(oxoInternationalSalary)}</span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '116.9pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Total Deductions</span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '116.9pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'right' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>LKR {formatCurrency(foreignDeductions)}</span>
                </p>
              </td>
            </tr>
            <tr style={{ height: '0pt' }}>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '108.1pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Net Foreign Pay </span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '350.6pt', verticalAlign: 'top' }} colSpan={3}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'right' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 400, fontSize: '11pt', color: '#000000' }}>LKR {formatCurrency(netForeignPay)}</span>
                </p>
              </td>
            </tr>
            <tr style={{ height: '0pt' }}>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '108.1pt', verticalAlign: 'top' }}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'left' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>Monthly Total Net Pay</span>
                </p>
              </td>
              <td style={{ border: '1pt solid #000000', padding: '0pt 5.4pt', width: '350.6pt', verticalAlign: 'top' }} colSpan={3}>
                <p style={{ margin: 0, paddingTop: '4pt', paddingBottom: '4pt', lineHeight: 1.0, textAlign: 'right' }}>
                  <span style={{ fontFamily: 'Garamond, serif', fontWeight: 700, fontSize: '11pt', color: '#000000' }}>LKR {formatCurrency(monthlyTotalNetPay)}</span>
                </p>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Signature Section */}
        <div className="flex justify-end items-center" style={{ paddingTop: '0pt', paddingBottom: '8pt', lineHeight: 1.158, textAlign: 'left', marginTop: '16pt' }}>
          <div style={{ display: 'inline-block', width: '208px', height: '208px', border: '0px solid #000000' }}>
            <Image
              src="/seal.png"
              alt="OXO International Seal"
              width={208}
              height={208}
              style={{ width: '208px', height: '208px', objectFit: 'contain' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ paddingTop: '1pt', borderTop: '0.5pt solid #000000', paddingBottom: '0pt', lineHeight: 1.0, textAlign: 'left', marginTop: '8pt' }}>
          <p style={{ margin: 0 }}>
            <span style={{ fontFamily: 'Calibri, sans-serif', fontSize: '12pt', color: '#000000' }}>OXO International FZE</span>
          </p>
        </div>
      </div>
    </div>
  );
}
