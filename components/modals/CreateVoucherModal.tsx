'use client';

import { useState, useEffect, useRef } from 'react';
import api from '@/lib/api';
import { DocumentArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ServiceProvider {
  id: number;
  first_name: string;
  last_name: string;
  company_name?: string | null;
  email: string;
}

interface CreateVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateVoucherModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateVoucherModalProps) {
  const [serviceProviders, setServiceProviders] = useState<ServiceProvider[]>([]);
  const [loadingSp, setLoadingSp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    service_provider_id: '',
    amount: '',
    vat: '',
    description: '',
  });

  useEffect(() => {
    if (isOpen) {
      setError('');
      setInvoiceFile(null);
      setFormData({ service_provider_id: '', amount: '', vat: '', description: '' });
      fetchServiceProviders();
    }
  }, [isOpen]);

  const fetchServiceProviders = async () => {
    setLoadingSp(true);
    try {
      const res = await api.get('/vouchers/service-providers');
      const users = Array.isArray(res.data) ? res.data : [];
      setServiceProviders(users);
    } catch (err) {
      setError('Failed to load service providers');
    } finally {
      setLoadingSp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!formData.service_provider_id || !formData.amount) {
      setError('Service Provider and Amount are required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append('service_provider_id', formData.service_provider_id);
      payload.append('amount', formData.amount);
      payload.append('vat', formData.vat || '0');
      if (formData.description) payload.append('description', formData.description);
      if (invoiceFile) payload.append('invoice', invoiceFile);

      await api.post('/vouchers', payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create voucher');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
        <div className="relative rounded-2xl bg-white shadow-xl sm:max-w-lg w-full p-6 text-left">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-[#101828]">Create Payment Voucher</h3>
            <button type="button" onClick={onClose} className="text-[#98A2B3] hover:text-[#344054]">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#344054] mb-2">Service Provider *</label>
              <select
                required
                value={formData.service_provider_id}
                onChange={(e) => setFormData({ ...formData, service_provider_id: e.target.value })}
                className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                disabled={loadingSp}
              >
                <option value="">Select Service Provider</option>
                {serviceProviders.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.company_name || `${sp.first_name} ${sp.last_name}`} {sp.email ? `(${sp.email})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#344054] mb-2">Amount *</label>
              <input
                type="number"
                required
                min={0}
                step={0.01}
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#344054] mb-2">VAT</label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={formData.vat}
                onChange={(e) => setFormData({ ...formData, vat: e.target.value })}
                placeholder="0"
                className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#344054] mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
              />
            </div>

            <div className="border-t border-[#E4E7EC] pt-4">
              <label className="block text-sm font-semibold text-[#344054] mb-2">Invoice upload</label>
              <p className="text-xs text-[#667085] mb-2">PDF, images, or documents (optional). Max 10MB.</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.csv"
                onChange={(e) => setInvoiceFile(e.target.files?.[0] || null)}
                className="hidden"
              />
              {!invoiceFile ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 w-full px-4 py-3 border-2 border-dashed border-[#D0D5DD] rounded-lg text-sm text-[#667085] hover:border-[#465FFF] hover:text-[#465FFF] transition-colors"
                >
                  <DocumentArrowUpIcon className="h-5 w-5" />
                  Choose file
                </button>
              ) : (
                <div className="flex items-center justify-between px-4 py-3 bg-[#F9FAFB] border border-[#E4E7EC] rounded-lg">
                  <span className="text-sm text-[#344054] truncate flex-1">{invoiceFile.name}</span>
                  <button
                    type="button"
                    onClick={() => { setInvoiceFile(null); fileInputRef.current && (fileInputRef.current.value = ''); }}
                    className="ml-2 p-1 text-[#98A2B3] hover:text-red-600"
                    aria-label="Remove file"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-semibold text-[#344054] border border-[#D0D5DD] rounded-lg hover:bg-[#F9FAFB]">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="px-4 py-2.5 text-sm font-semibold text-white bg-[#465FFF] rounded-lg hover:bg-[#3641F5] disabled:opacity-50">
                {submitting ? 'Creating...' : 'Create Voucher'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
