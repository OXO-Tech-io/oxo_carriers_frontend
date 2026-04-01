'use client';

import { useState } from 'react';
import { UserRole } from '@/types';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    employee_id?: string;
    email: string;
    first_name: string;
    last_name: string;
    role: UserRole;
    department: string;
    position: string;
    hire_date: string;
    manager_id: string;
    hourly_rate?: string;
    bank_name?: string;
    account_holder_name?: string;
    account_number?: string;
    bank_branch?: string;
    company_name?: string;
    contact_number?: string;
  }) => Promise<void>;
  currentUserRole?: UserRole;
}

// Calculate leave days based on hire date
const calculateLeaveEntitlement = (hireDate: string): { firstYear: number; secondYearOnwards: number; quarter: string; remainingMonths: number } | null => {
  if (!hireDate) return null;
  
  const date = new Date(hireDate);
  const month = date.getMonth() + 1; // getMonth() returns 0-11 (Jan = 0, so add 1)
  const hireMonth = date.getMonth(); // 0-11
  
  // Calculate first year: 0.5 days per remaining month
  const remainingMonths = 12 - hireMonth;
  const firstYear = Math.round(remainingMonths * 0.5 * 10) / 10; // 0.5 days per month
  
  // Calculate second year onwards based on quarter
  let secondYearOnwards: number;
  let quarter: string;
  
  if (month >= 1 && month <= 3) {
    secondYearOnwards = 14;
    quarter = 'Q1 (Jan-Mar)';
  } else if (month >= 4 && month <= 6) {
    secondYearOnwards = 10;
    quarter = 'Q2 (Apr-Jun)';
  } else if (month >= 7 && month <= 9) {
    secondYearOnwards = 7;
    quarter = 'Q3 (Jul-Sep)';
  } else {
    secondYearOnwards = 4;
    quarter = 'Q4 (Oct-Dec)';
  }
  
  return { firstYear, secondYearOnwards, quarter, remainingMonths };
};

export default function CreateUserModal({
  isOpen,
  onClose,
  onSubmit,
  currentUserRole,
}: CreateUserModalProps) {
  const [formData, setFormData] = useState({
    employee_id: '',
    email: '',
    first_name: '',
    last_name: '',
    role: UserRole.EMPLOYEE,
    department: '',
    position: '',
    hire_date: '',
    manager_id: '',
    hourly_rate: '',
    bank_name: '',
    account_holder_name: '',
    account_number: '',
    bank_branch: '',
    company_name: '',
    contact_number: '',
  });
  const [submitting, setSubmitting] = useState(false);
  
  const leaveInfo = calculateLeaveEntitlement(formData.hire_date);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isServiceProvider = formData.role === UserRole.SERVICE_PROVIDER;
      const payload = isServiceProvider
        ? {
            ...formData,
            employee_id: '',
            first_name: formData.company_name || 'Service Provider',
            last_name: 'Service Provider',
          }
        : formData;
      await onSubmit(payload);
      setFormData({
        employee_id: '',
        email: '',
        first_name: '',
        last_name: '',
        role: UserRole.EMPLOYEE,
        department: '',
        position: '',
        hire_date: '',
        manager_id: '',
        hourly_rate: '',
        bank_name: '',
        account_holder_name: '',
        account_number: '',
        bank_branch: '',
        company_name: '',
        contact_number: '',
      });
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div 
          className="fixed inset-0 bg-opacity-50 backdrop-blur-sm transition-opacity" 
          onClick={onClose}
        ></div>
        <div 
          className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-[#101828]">Create New Employee</h3>
              <button
                onClick={onClose}
                className="text-[#98A2B3] hover:text-[#344054] transition-colors"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#344054] mb-2">
                  Role *
                </label>
                <select
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole, hourly_rate: formData.role === UserRole.CONSULTANT ? formData.hourly_rate : '' })}
                  className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm font-medium text-[#344054] bg-white focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                >
                  <option value={UserRole.EMPLOYEE}>Employee</option>
                  <option value={UserRole.CONSULTANT}>Consultant</option>
                  <option value={UserRole.HR_EXECUTIVE}>HR Executive</option>
                  <option value={UserRole.FINANCE_EXECUTIVE}>Finance Executive</option>
                  <option value={UserRole.FINANCE_MANAGER}>Finance Manager</option>
                  <option value={UserRole.PAYMENT_APPROVER}>Payment Approver</option>
                  {currentUserRole === UserRole.HR_MANAGER && (
                    <option value={UserRole.HR_MANAGER}>HR Manager</option>
                  )}
                </select>
              </div>
              {formData.role !== UserRole.SERVICE_PROVIDER && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-[#344054] mb-2">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={formData.employee_id}
                      onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                      placeholder="Leave empty to auto-generate (e.g., EMP20260001)"
                      className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                    />
                    <p className="text-xs text-[#667085] mt-1">Optional: Leave blank to auto-generate based on year</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#344054] mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#344054] mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                      />
                    </div>
                  </div>
                </>
              )}
              {formData.role === UserRole.SERVICE_PROVIDER ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-[#344054] mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      placeholder="Company or organization name"
                      className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#344054] mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#344054] mb-2">
                      Contact Number
                    </label>
                    <input
                      type="text"
                      value={formData.contact_number}
                      onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                      placeholder="e.g. +94 77 123 4567"
                      className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-[#344054] mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#344054] mb-2">
                        Department
                      </label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-[#344054] mb-2">
                        Position
                      </label>
                      <input
                        type="text"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#344054] mb-2">
                      Hire Date
                    </label>
                    <input
                      type="date"
                      value={formData.hire_date}
                      onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                      className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                    />
                  </div>
                </>
              )}
              {formData.role === UserRole.CONSULTANT && (
                <div>
                  <label className="block text-sm font-semibold text-[#344054] mb-2">
                    Hourly Rate *
                  </label>
                  <input
                    type="number"
                    required={formData.role === UserRole.CONSULTANT}
                    min={0}
                    step={0.01}
                    value={formData.hourly_rate}
                    onChange={(e) => setFormData({ ...formData, hourly_rate: e.target.value })}
                    placeholder="e.g. 50.00"
                    className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                  />
                  <p className="text-xs text-[#667085] mt-1">Required for Consultant role</p>
                </div>
              )}

              <div className="border-t border-[#E4E7EC] pt-4">
                <p className="text-sm font-semibold text-[#344054] mb-3">Bank Details</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={formData.bank_name}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                      placeholder="e.g. Commercial Bank"
                      className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      value={formData.account_holder_name}
                      onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
                      placeholder="Name as per bank account"
                      className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-1">Account Number</label>
                    <input
                      type="text"
                      value={formData.account_number}
                      onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                      placeholder="Bank account number"
                      className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-1">Branch</label>
                    <input
                      type="text"
                      value={formData.bank_branch}
                      onChange={(e) => setFormData({ ...formData, bank_branch: e.target.value })}
                      placeholder="Branch name or code"
                      className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              
              {leaveInfo && formData.role === UserRole.EMPLOYEE && (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-lg p-4 mt-4">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="h-5 w-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-emerald-900 mb-1">
                        Annual Leave Entitlement
                      </p>
                      <p className="text-xs text-emerald-700 mb-2">
                        Hired in {leaveInfo.quarter} • {leaveInfo.remainingMonths} months remaining in first year
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white rounded-lg p-2.5 border border-emerald-100">
                          <p className="text-xs text-emerald-600 font-medium mb-1">First Year ({new Date(formData.hire_date).getFullYear()})</p>
                          <p className="text-lg font-bold text-emerald-900">{leaveInfo.firstYear} days</p>
                          <p className="text-[10px] text-emerald-600 mt-0.5">0.5 days × {leaveInfo.remainingMonths} months</p>
                        </div>
                        <div className="bg-white rounded-lg p-2.5 border border-emerald-100">
                          <p className="text-xs text-emerald-600 font-medium mb-1">Second Year Onwards</p>
                          <p className="text-lg font-bold text-emerald-900">{leaveInfo.secondYearOnwards} days</p>
                          <p className="text-[10px] text-emerald-600 mt-0.5">Based on hire quarter</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {formData.role !== UserRole.SERVICE_PROVIDER && (
                <div className="bg-[#ECF3FF] border border-[#DDE9FF] rounded-lg p-4 mt-4">
                  <p className="text-sm text-[#344054]">
                    <strong>Note:</strong> The employee will receive an email with a link to set up their password.
                    They must complete password setup before they can log in.
                  </p>
                </div>
              )}
              {formData.role === UserRole.SERVICE_PROVIDER && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-amber-800">
                    <strong>Service Provider:</strong> This user will not receive a login or password setup email. They do not need to log in.
                  </p>
                </div>
              )}
              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-sm font-semibold text-[#344054] bg-white border border-[#D0D5DD] rounded-lg hover:bg-[#F9FAFB] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2.5 text-sm font-semibold text-white bg-[#465FFF] rounded-lg hover:bg-[#3641F5] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating...' : 'Create Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
