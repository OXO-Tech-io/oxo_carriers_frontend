'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { DocumentArrowUpIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export default function AdminUploadPage() {
  const { user, isHR } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [uploadResults, setUploadResults] = useState<any>(null);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
          selectedFile.type === 'application/vnd.ms-excel' ||
          selectedFile.name.endsWith('.xlsx') ||
          selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Please select a valid Excel file (.xlsx or .xls)');
        setFile(null);
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setUploadResults(null);

    if (!file) {
      setError('Please select an Excel file');
      return;
    }

    if (!selectedMonth) {
      setError('Please select a month');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('excel', file);
      formData.append('month', selectedMonth);
      formData.append('year', selectedYear.toString());

      const response = await api.post('/salary/bulk-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess(response.data.message || 'Salaries uploaded successfully');
      setUploadResults(response.data.results);
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('excel-file') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to upload salaries';
      setError(errorMessage);
      
      // Show detailed error information if available
      if (err.response?.data?.foundColumns) {
        const foundCols = err.response.data.foundColumns;
        const missingCols = [];
        if (!foundCols.id) missingCols.push('id');
        if (!foundCols.fullSalary) missingCols.push('Full Salary');
        if (missingCols.length > 0) {
          setError(`${errorMessage}. Missing columns: ${missingCols.join(', ')}`);
        }
      }
      
      if (err.response?.data?.results) {
        setUploadResults(err.response.data.results);
      }
    } finally {
      setUploading(false);
    }
  };

  if (!isHR) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-[#101828]">Upload Salary Excel</h1>
        <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-12 text-center">
          <p className="text-sm text-[#475467]">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#101828]">Upload Salary Excel</h1>
          <p className="text-sm text-[#475467] mt-1">Upload Excel file to create salary slips for employees</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-6 lg:p-8">
        <form onSubmit={handleUpload} className="space-y-6">
          {/* Month and Year Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-[#344054] mb-2">
                Month *
              </label>
              <select
                required
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm font-medium text-[#344054] bg-white focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
              >
                <option value="">Select month</option>
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
            <div>
              <label className="block text-sm font-semibold text-[#344054] mb-2">
                Year *
              </label>
              <input
                type="number"
                required
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                min={2020}
                max={currentYear + 1}
                className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
              />
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-semibold text-[#344054] mb-2">
              Excel File *
            </label>
            <div className="flex items-center space-x-3">
              <label className="flex-1 cursor-pointer">
                <input
                  id="excel-file"
                  type="file"
                  accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex items-center space-x-2 px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#475467] hover:bg-[#F9FAFB] transition-colors">
                  <DocumentArrowUpIcon className="h-5 w-5" />
                  <span>{file ? file.name : 'Choose Excel file'}</span>
                </div>
              </label>
            </div>
            <p className="mt-2 text-xs text-[#475467]">
              Required columns: id, name, Local Salary, OXO International Salary, Working Days, EPF 8%<br />
              <span className="text-[#98A2B3]">Note: Full Salary will be calculated as Local Salary + OXO International Salary</span>
            </p>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="p-4 bg-[#D1FADF] border border-[#6EE7B7] rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-[#065F46]" />
                <p className="text-sm font-semibold text-[#065F46]">{success}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-[#FEE4E2] border border-[#FCA5A5] rounded-lg">
              <div className="flex items-center space-x-2">
                <XCircleIcon className="h-5 w-5 text-[#991B1B]" />
                <p className="text-sm font-semibold text-[#991B1B]">{error}</p>
              </div>
            </div>
          )}

          {/* Upload Results */}
          {uploadResults && (
            <div className="p-4 bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg">
              <h3 className="text-sm font-semibold text-[#344054] mb-2">Upload Results:</h3>
              <div className="space-y-1 text-sm text-[#475467]">
                <p>✓ Successfully processed: <span className="font-semibold text-[#065F46]">{uploadResults.success}</span></p>
                {uploadResults.failed > 0 && (
                  <p>✗ Failed: <span className="font-semibold text-[#991B1B]">{uploadResults.failed}</span></p>
                )}
                {uploadResults.errors && uploadResults.errors.length > 0 && (
                  <div className="mt-3">
                    <p className="font-semibold text-[#344054] mb-1">Errors:</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      {uploadResults.errors.map((err: string, index: number) => (
                        <li key={index} className="text-[#991B1B]">{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="submit"
              disabled={uploading || !file || !selectedMonth}
              className="px-4 py-2.5 text-sm font-semibold text-white bg-[#465FFF] rounded-lg hover:bg-[#3641F5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading...' : 'Upload & Create Salary Slips'}
            </button>
          </div>
        </form>
      </div>

      {/* Instructions */}
      <div className="bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg p-6">
        <h2 className="text-lg font-bold text-[#101828] mb-4">Excel File Format Requirements</h2>
        <div className="space-y-3 text-sm text-[#475467]">
          <p className="font-semibold text-[#344054]">Required columns (in any order):</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>id</strong> - User ID (must match user ID in system)</li>
            <li><strong>name</strong> - Employee name (for reference)</li>
            <li><strong>Local Salary</strong> - Local salary component (required)</li>
            <li><strong>OXO International Salary</strong> - OXO International Salary component (required)</li>
            <li><strong>Working Days</strong> - Format: "Available Dates, Leaves, Worked Days" or just "Worked Days"</li>
            <li><strong>EPF 8%</strong> - EPF deduction (8% of Local Salary)</li>
          </ul>
          <p className="mt-3 text-sm text-[#475467]">
            <strong>Note:</strong> Full Salary will be automatically calculated as <strong>Local Salary + OXO International Salary</strong>. 
            If a Full Salary column exists in your Excel, it will be ignored.
          </p>
          <p className="mt-4 text-xs text-[#98A2B3]">
            Note: The system will automatically match IDs with users and create salary slips for the selected month.
          </p>
        </div>
      </div>
    </div>
  );
}
