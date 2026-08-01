'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  UploadCloud,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Info
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';

type ClaimType = 'IN' | 'OPD';
type ClaimStatus = 'pending' | 'approved' | 'rejected';

interface MedicalClaim {
  id: number;
  type: ClaimType;
  quarter: string;
  amount: number;
  status: ClaimStatus;
  supportive_document_url: string;
  relevant_document_url?: string | null;
  admin_comment?: string | null;
  resubmission_of?: number | null;
  created_at: string;
}

interface Limits {
  IN: { maxPerClaim: number };
  OPD: { maxPerQuarter: number; yearlyTotal: number };
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';

const formatCurrency = (value: number | string | undefined): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : (value || 0);
  return numValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export default function MedicalInsurancePage() {
  const [activeTab, setActiveTab] = useState<'apply' | 'claims'>('claims');
  const [claims, setClaims] = useState<MedicalClaim[]>([]);
  const [limits, setLimits] = useState<{ limits: Limits; currentQuarter: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    type: '' as ClaimType | '',
    quarter: '',
    amount: '',
  });
  const [supportiveFile, setSupportiveFile] = useState<File | null>(null);
  const [relevantFile, setRelevantFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [resubmitClaimId, setResubmitClaimId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [claimsRes, limitsRes] = await Promise.all([
        api.get('/medical-insurance-claims'),
        api.get('/medical-insurance-claims/limits'),
      ]);
      setClaims(claimsRes.data.claims || []);
      setLimits(limitsRes.data);
      if (limitsRes.data?.currentQuarter && !formData.quarter) {
        setFormData((prev) => ({ ...prev, quarter: limitsRes.data.currentQuarter }));
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const maxAmount = formData.type === 'IN' ? 300000 : formData.type === 'OPD' ? 6000 : 0;
  const isAmountValid = formData.amount ? parseFloat(formData.amount) <= maxAmount && parseFloat(formData.amount) > 0 : false;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resubmitClaimId) {
      if (!supportiveFile) {
        setError('Supportive document is required for resubmission');
        return;
      }
      if (!isAmountValid || !formData.quarter) {
        setError('Please correct type, quarter, and amount.');
        return;
      }
      setError('');
      setSubmitting(true);
      try {
        const fd = new FormData();
        fd.append('type', formData.type);
        fd.append('quarter', formData.quarter);
        fd.append('amount', formData.amount);
        fd.append('supportive_document', supportiveFile);
        if (relevantFile) fd.append('relevant_document', relevantFile);
        await api.post(`/medical-insurance-claims/${resubmitClaimId}/resubmissions`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSuccess('Claim resubmitted successfully.');
        setResubmitClaimId(null);
        setFormData({ type: '', quarter: limits?.currentQuarter ?? '', amount: '' });
        setSupportiveFile(null);
        setRelevantFile(null);
        fetchData();
        setActiveTab('claims');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to resubmit');
      } finally {
        setSubmitting(false);
      }
    } else {
      setError('');
      setSuccess('');
      setSubmitting(true);
      try {
        const fd = new FormData();
        fd.append('type', formData.type);
        fd.append('quarter', formData.quarter || (limits?.currentQuarter ?? ''));
        fd.append('amount', formData.amount);
        if (supportiveFile) fd.append('supportive_document', supportiveFile);
        if (relevantFile) fd.append('relevant_document', relevantFile);
        await api.post('/medical-insurance-claims', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSuccess('Medical insurance claim submitted. Status: Pending.');
        setFormData({ type: '', quarter: limits?.currentQuarter ?? '', amount: '' });
        setSupportiveFile(null);
        setRelevantFile(null);
        fetchData();
        setActiveTab('claims');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to submit claim');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const getStatusBadge = (status: ClaimStatus) => {
    const styles = {
      pending: 'bg-[var(--warning-light)] text-[var(--warning-text)] border border-[var(--warning-text)]/10',
      approved: 'bg-[var(--success-light)] text-[var(--success-text)] border border-[var(--success-text)]/10',
      rejected: 'bg-[var(--error-light)] text-[var(--error-text)] border border-[var(--error-text)]/10',
    };
    return styles[status] || styles.pending;
  };

  const getStatusIcon = (status: ClaimStatus) => {
    switch (status) {
      case 'approved':
        return <CheckCircle2 className="h-4 w-4 text-[var(--success-text)]" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-[var(--error-text)]" />;
      default:
        return <Clock className="h-4 w-4 text-[var(--warning-text)]" />;
    }
  };

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
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-[var(--foreground)] tracking-tight">Medical Insurance</h1>
          <p className="text-sm text-[var(--gray-400)] font-medium mt-1">Apply for IN / OPD claims and track your submissions.</p>
        </div>
        <Button
          onClick={() => {
            setResubmitClaimId(null);
            setFormData({ type: '', quarter: limits?.currentQuarter ?? '', amount: '' });
            setSupportiveFile(null);
            setRelevantFile(null);
            setActiveTab('apply');
          }}
          className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-sm flex items-center justify-center self-start sm:self-center cursor-pointer"
          leftIcon={<Plus className="h-4 w-4" />}
        >
          New Claim
        </Button>
      </div>

      {/* Notifications */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-[var(--error-light)] border-l-4 border-[var(--error)] text-[var(--error-text)] p-4 rounded-xl text-xs font-semibold"
          >
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-[var(--success-light)] border-l-4 border-[var(--success)] text-[var(--success-text)] p-4 rounded-xl text-xs font-semibold"
          >
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs Selector */}
      <div className="border-b border-[var(--gray-100)]">
        <nav className="-mb-px flex space-x-6">
          <button
            onClick={() => setActiveTab('claims')}
            className={`py-4 px-1 border-b-2 font-bold text-sm transition-all duration-200 cursor-pointer ${
              activeTab === 'claims'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--gray-400)] hover:text-[var(--gray-600)] hover:border-[var(--gray-200)]'
            }`}
          >
            My Claims
          </button>
          <button
            onClick={() => {
              setResubmitClaimId(null);
              setFormData({ type: '', quarter: limits?.currentQuarter ?? '', amount: '' });
              setSupportiveFile(null);
              setRelevantFile(null);
              setActiveTab('apply');
            }}
            className={`py-4 px-1 border-b-2 font-bold text-sm transition-all duration-200 cursor-pointer ${
              activeTab === 'apply'
                ? 'border-[var(--primary)] text-[var(--primary)]'
                : 'border-transparent text-[var(--gray-400)] hover:text-[var(--gray-600)] hover:border-[var(--gray-200)]'
            }`}
          >
            {resubmitClaimId ? 'Resubmit Claim' : 'Apply'}
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-[var(--primary)] border-t-transparent" />
            </div>
            <p className="text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Loading medical insurance claims...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === 'apply' && (
            <motion.div
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="max-w-3xl mx-auto"
            >
              <Card padding="lg" className="shadow-[var(--shadow-md)] border-[var(--gray-100)]">
                <h2 className="text-lg font-bold text-[var(--foreground)] tracking-tight mb-4">
                  {resubmitClaimId ? 'Resubmit Claims Application' : 'Medical Claims Application'}
                </h2>
                
                {/* Limits Alert Card */}
                {limits && (
                  <div className="mb-6 p-4.5 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs text-[var(--foreground)] flex gap-3.5">
                    <Info className="h-5 w-5 text-[var(--primary)] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-[var(--primary)] uppercase tracking-wider text-[10px]">Medical Claim Limits</p>
                      <ul className="list-disc pl-4 space-y-0.5 text-[var(--gray-500)] font-medium">
                        <li><strong>In-patient (IN):</strong> Up to LKR {formatCurrency(300000)} max per claim.</li>
                        <li><strong>Out-patient (OPD):</strong> LKR {formatCurrency(6000)} per quarter ({formatCurrency(24000)} per year).</li>
                        <li><strong>Current Quarter:</strong> {limits.currentQuarter}</li>
                      </ul>
                    </div>
                  </div>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">Claim Type *</label>
                      <select
                        required
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as ClaimType })}
                        className="block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all cursor-pointer"
                      >
                        <option value="" className="bg-[var(--card-bg)]">Select type</option>
                        <option value="IN" className="bg-[var(--card-bg)]">In-patient (IN)</option>
                        <option value="OPD" className="bg-[var(--card-bg)]">Out-patient (OPD)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">Quarter *</label>
                      <input
                        type="text"
                        readOnly={!resubmitClaimId}
                        value={formData.quarter || limits?.currentQuarter || ''}
                        onChange={resubmitClaimId ? (e) => setFormData({ ...formData, quarter: e.target.value }) : undefined}
                        className={`block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all ${
                          !resubmitClaimId ? 'bg-[var(--gray-25)] cursor-not-allowed text-[var(--gray-400)]' : 'bg-[var(--card-bg)]'
                        }`}
                      />
                      <p className="mt-1.5 text-[10px] font-semibold text-[var(--gray-400)]">
                        {resubmitClaimId ? 'You can edit quarter if needed.' : 'Auto-derived from current date.'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">Claim Amount (LKR) *</label>
                    <input
                      type="number"
                      required
                      min={0}
                      max={maxAmount || 300000}
                      step={0.01}
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="block w-full px-3.5 py-2.5 border border-[var(--gray-100)] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all placeholder:text-[var(--gray-300)]"
                      placeholder={formData.type === 'OPD' ? 'Max 6,000 per quarter' : formData.type === 'IN' ? 'Max 300,000 per claim' : 'Select claim type first'}
                    />
                    {formData.type && (
                      <p className="mt-1.5 text-[10px] font-bold text-[var(--primary)]">
                        Maximum Allowed: LKR {formatCurrency(maxAmount)} {formData.type === 'OPD' ? 'per quarter' : 'per claim'}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">Supportive Document (Required) *</label>
                      <label className="group flex flex-col items-center justify-center p-5 border-2 border-dashed border-[var(--gray-100)] hover:border-[var(--primary)] rounded-2xl cursor-pointer bg-[var(--gray-25)] hover:bg-[var(--primary-light)]/30 transition-all duration-300">
                        <UploadCloud className="h-6 w-6 text-[var(--gray-300)] group-hover:text-[var(--primary)] transition-colors mb-2" />
                        <span className="text-xs font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors text-center truncate max-w-full">
                          {supportiveFile ? supportiveFile.name : 'Click to Upload Document'}
                        </span>
                        <span className="text-[9px] font-medium text-[var(--gray-400)] mt-1">PDF, JPG, PNG or Word</span>
                        <input
                          type="file"
                          required={!resubmitClaimId}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => setSupportiveFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">Relevant Document (Optional)</label>
                      <label className="group flex flex-col items-center justify-center p-5 border-2 border-dashed border-[var(--gray-100)] hover:border-[var(--primary)] rounded-2xl cursor-pointer bg-[var(--gray-25)] hover:bg-[var(--primary-light)]/30 transition-all duration-300">
                        <UploadCloud className="h-6 w-6 text-[var(--gray-300)] group-hover:text-[var(--primary)] transition-colors mb-2" />
                        <span className="text-xs font-bold text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors text-center truncate max-w-full">
                          {relevantFile ? relevantFile.name : 'Click to Upload Document'}
                        </span>
                        <span className="text-[9px] font-medium text-[var(--gray-400)] mt-1">PDF, JPG, PNG or Word</span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => setRelevantFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-[var(--gray-50)]">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setResubmitClaimId(null);
                        setFormData({ type: '', quarter: limits?.currentQuarter ?? '', amount: '' });
                        setSupportiveFile(null);
                        setRelevantFile(null);
                        setActiveTab('claims');
                      }}
                      className="cursor-pointer text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting || !formData.type || !formData.amount || (!supportiveFile && !resubmitClaimId) || !isAmountValid || (resubmitClaimId ? !formData.quarter : false)}
                      className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-sm cursor-pointer text-xs"
                    >
                      {submitting ? 'Submitting...' : resubmitClaimId ? 'Resubmit Claim' : 'Submit Claim'}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}

          {activeTab === 'claims' && (
            <motion.div variants={itemVariants}>
              {claims.length === 0 ? (
                <Card className="text-center p-12 shadow-sm border-[var(--gray-100)] max-w-lg mx-auto">
                  <FileText className="h-10 w-10 text-[var(--gray-300)] mx-auto mb-3" />
                  <h3 className="text-sm font-bold text-[var(--foreground)] mb-1">No medical claims found</h3>
                  <p className="text-xs text-[var(--gray-400)] mb-4">You do not have any medical insurance claims submitted yet.</p>
                  <Button
                    onClick={() => setActiveTab('apply')}
                    className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white cursor-pointer text-xs px-5"
                  >
                    Submit a Claim
                  </Button>
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
                              <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Type</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Quarter</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Amount</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Status</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Submitted</th>
                              <th className="px-6 py-4 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-[var(--card-bg)] divide-y divide-[var(--gray-100)]">
                            {claims.map((claim) => (
                              <tr key={claim.id} className="hover:bg-[var(--gray-25)] transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[var(--foreground)]">
                                  {claim.type === 'IN' ? 'In-patient (IN)' : 'Out-patient (OPD)'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[var(--gray-500)]">
                                  {claim.quarter}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-[var(--foreground)]">
                                  LKR {formatCurrency(claim.amount)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(claim.status)}`}>
                                    {getStatusIcon(claim.status)}
                                    {claim.status}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--gray-400)]">
                                  {format(new Date(claim.created_at), 'MMM dd, yyyy')}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium">
                                  <div className="flex flex-col gap-2">
                                    <a
                                      href={`${API_BASE}${claim.supportive_document_url}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline"
                                    >
                                      <ExternalLink className="h-3.5 w-3.5" />
                                      <span>Supportive Doc</span>
                                    </a>
                                    {claim.relevant_document_url && (
                                      <a
                                        href={`${API_BASE}${claim.relevant_document_url}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline"
                                      >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                        <span>Relevant Doc</span>
                                      </a>
                                    )}
                                    {claim.status === 'rejected' && (
                                      <div className="pt-1 border-t border-[var(--gray-50)] mt-1">
                                        {claim.admin_comment && (
                                          <p className="text-[10px] text-[var(--error-text)] font-semibold mb-2 max-w-xs break-words">
                                            Reason: {claim.admin_comment}
                                          </p>
                                        )}
                                        {!claims.some((other) => other.resubmission_of === claim.id) && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setResubmitClaimId(claim.id);
                                              setFormData({
                                                type: claim.type,
                                                quarter: claim.quarter,
                                                amount: String(claim.amount),
                                              });
                                              setSupportiveFile(null);
                                              setRelevantFile(null);
                                              setActiveTab('apply');
                                            }}
                                            className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:text-[var(--primary-hover)] hover:underline cursor-pointer"
                                          >
                                            <RefreshCw className="h-3 w-3" />
                                            <span>Resubmit Claim</span>
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  </div>

                  {/* Mobile Cards View */}
                  <div className="md:hidden flex flex-col gap-4">
                    {claims.map((claim) => (
                      <Card key={claim.id} padding="md" className="shadow-sm border-[var(--gray-100)] flex flex-col gap-4">
                        {/* Title & Status Badge */}
                        <div className="flex justify-between items-center pb-3 border-b border-[var(--gray-50)]">
                          <div>
                            <span className="text-sm font-bold text-[var(--foreground)]">
                              {claim.type === 'IN' ? 'In-patient (IN)' : 'Out-patient (OPD)'}
                            </span>
                            <span className="text-[10px] text-[var(--gray-400)] block font-semibold mt-0.5">
                              Quarter: {claim.quarter}
                            </span>
                          </div>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${getStatusBadge(claim.status)}`}>
                            {getStatusIcon(claim.status)}
                            {claim.status}
                          </span>
                        </div>

                        {/* Amount & Date Grid */}
                        <div className="grid grid-cols-2 gap-y-2 text-xs">
                          <div>
                            <p className="text-[10px] font-semibold text-[var(--gray-400)]">Claim Amount</p>
                            <p className="font-extrabold text-[var(--foreground)]">LKR {formatCurrency(claim.amount)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-semibold text-[var(--gray-400)]">Date Submitted</p>
                            <p className="font-semibold text-[var(--gray-600)]">
                              {format(new Date(claim.created_at), 'MMM dd, yyyy')}
                            </p>
                          </div>
                        </div>

                        {/* Rejected reason banner */}
                        {claim.status === 'rejected' && claim.admin_comment && (
                          <div className="p-3 bg-[var(--error-light)] text-[var(--error-text)] rounded-xl text-xs font-medium border border-[var(--error-text)]/5">
                            <strong>Reject Reason: </strong> {claim.admin_comment}
                          </div>
                        )}

                        {/* Document & Resubmit Actions */}
                        <div className="flex flex-col gap-2 pt-3 border-t border-[var(--gray-50)]">
                          <div className="flex flex-wrap gap-3">
                            <a
                              href={`${API_BASE}${claim.supportive_document_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              <span>Supportive Doc</span>
                            </a>
                            {claim.relevant_document_url && (
                              <a
                                href={`${API_BASE}${claim.relevant_document_url}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs font-bold text-[var(--primary)] hover:underline"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                <span>Relevant Doc</span>
                              </a>
                            )}
                          </div>

                          {claim.status === 'rejected' && !claims.some((other) => other.resubmission_of === claim.id) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-xs mt-1 py-2 cursor-pointer"
                              leftIcon={<RefreshCw className="h-3.5 w-3.5" />}
                              onClick={() => {
                                setResubmitClaimId(claim.id);
                                setFormData({
                                  type: claim.type,
                                  quarter: claim.quarter,
                                  amount: String(claim.amount),
                                });
                                setSupportiveFile(null);
                                setRelevantFile(null);
                                setActiveTab('apply');
                              }}
                            >
                              Resubmit Claim
                            </Button>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}
