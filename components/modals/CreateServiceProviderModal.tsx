'use client';

import { useState } from 'react';

export interface CreateServiceProviderPayload {
  email: string;
  company_name: string;
  contact_number?: string;
  bank_name?: string;
  account_holder_name?: string;
  account_number?: string;
  bank_branch?: string;
}

interface CreateServiceProviderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateServiceProviderPayload) => Promise<void>;
}

export default function CreateServiceProviderModal({
  isOpen,
  onClose,
  onSubmit,
}: CreateServiceProviderModalProps) {
  const [formData, setFormData] = useState<CreateServiceProviderPayload>({
    email: '',
    company_name: '',
    contact_number: '',
    bank_name: '',
    account_holder_name: '',
    account_number: '',
    bank_branch: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({
        email: '',
        company_name: '',
        contact_number: '',
        bank_name: '',
        account_holder_name: '',
        account_number: '',
        bank_branch: '',
      });
    } catch {
      // Error handled in parent
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
        />
        <div
          className="relative transform overflow-hidden rounded-2xl bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white px-6 pt-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-2xl font-bold text-[#101828]">Create Service Provider</h3>
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
                <label className="block text-sm font-semibold text-[#344054] mb-2">Company Name *</label>
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
                <label className="block text-sm font-semibold text-[#344054] mb-2">Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#344054] mb-2">Contact Number</label>
                <input
                  type="text"
                  value={formData.contact_number || ''}
                  onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                  placeholder="e.g. +94 77 123 4567"
                  className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                />
              </div>
              <div className="border-t border-[#E4E7EC] pt-4">
                <p className="text-sm font-semibold text-[#344054] mb-3">Bank Details (optional)</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={formData.bank_name || ''}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                      placeholder="e.g. Commercial Bank"
                      className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      value={formData.account_holder_name || ''}
                      onChange={(e) => setFormData({ ...formData, account_holder_name: e.target.value })}
                      placeholder="Name as per bank account"
                      className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-1">Account Number</label>
                    <input
                      type="text"
                      value={formData.account_number || ''}
                      onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                      placeholder="Bank account number"
                      className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-1">Branch</label>
                    <input
                      type="text"
                      value={formData.bank_branch || ''}
                      onChange={(e) => setFormData({ ...formData, bank_branch: e.target.value })}
                      placeholder="Branch name or code"
                      className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-amber-800">
                  <strong>Note:</strong> Vendors are stored separately. No email verification is sent. They do not log in.
                </p>
              </div>
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
                  {submitting ? 'Creating...' : 'Create Service Provider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
