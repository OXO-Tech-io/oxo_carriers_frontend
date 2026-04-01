'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import {
  DocumentTextIcon,
  UserIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import type { ConsultantWorkSubmission, ConsultantSubmissionStatus } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';

export default function AdminConsultantSubmissionsPage() {
  const { isHR } = useAuth();
  const [submissions, setSubmissions] = useState<ConsultantWorkSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState<ConsultantSubmissionStatus | ''>('');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectComment, setRejectComment] = useState('');

  useEffect(() => {
    if (isHR) fetchSubmissions();
  }, [isHR, filterStatus]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      const qs = params.toString();
      const res = await api.get(`/consultant-submissions${qs ? `?${qs}` : ''}`);
      setSubmissions(res.data.submissions || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      setError('');
      await api.put(`/consultant-submissions/${id}/approve`);
      setSuccess('Submission approved.');
      fetchSubmissions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleReject = async (id: number) => {
    if (!rejectComment.trim()) {
      setError('Comment is required when rejecting.');
      return;
    }
    try {
      setError('');
      await api.put(`/consultant-submissions/${id}/reject`, { admin_comment: rejectComment.trim() });
      setSuccess('Submission rejected.');
      setRejectingId(null);
      setRejectComment('');
      fetchSubmissions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject');
    }
  };

  const getStatusBadge = (status: ConsultantSubmissionStatus) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return styles[status] || styles.pending;
  };

  if (!isHR) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-[#475467]">Access denied.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-[#101828]">Consultant Work Submissions</h1>
        <p className="mt-2 text-[#475467]">Review and approve or reject consultant work submissions</p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 text-emerald-700 p-4 rounded-lg">
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs font-medium text-[#667085] mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ConsultantSubmissionStatus | '')}
            className="block w-full min-w-[120px] px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm bg-white focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
          >
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center min-h-64 items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#465FFF] border-t-transparent" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-12 text-center">
          <DocumentTextIcon className="h-12 w-12 text-[#98A2B3] mx-auto mb-4" />
          <p className="text-sm font-medium text-[#344054]">No consultant submissions found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((s) => (
            <div
              key={s.id}
              className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 rounded-lg bg-[#ECF3FF]">
                      <UserIcon className="h-5 w-5 text-[#465FFF]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#101828]">
                        {s.user?.first_name} {s.user?.last_name}
                      </p>
                      <p className="text-xs text-[#475467]">{s.user?.email} · {s.user?.employee_id}</p>
                      {s.user?.hourly_rate != null && (
                        <p className="text-xs text-[#667085]">Hourly rate: {s.user.hourly_rate}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-[#98A2B3] mb-1">Project</p>
                      <p className="text-sm font-semibold text-[#344054]">{s.project}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#98A2B3] mb-1">Tech</p>
                      <p className="text-sm font-semibold text-[#344054]">{s.tech}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#98A2B3] mb-1">Total Hours</p>
                      <p className="text-sm font-semibold text-[#344054]">{s.total_hours}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#98A2B3] mb-1">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(s.status)}`}>
                        {s.status}
                      </span>
                    </div>
                  </div>
                  {s.comment && (
                    <div className="mb-4">
                      <p className="text-xs text-[#98A2B3] mb-1">Comment</p>
                      <p className="text-sm text-[#475467]">{s.comment}</p>
                    </div>
                  )}
                  <div className="mb-2">
                    <a
                      href={`${API_BASE}${s.log_sheet_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-[#465FFF] hover:text-[#3641F5]"
                    >
                      <DocumentArrowUpIcon className="h-4 w-4 mr-1" /> View log sheet
                    </a>
                  </div>
                  {s.resubmission_of && (
                    <p className="text-xs text-[#667085]">Resubmission of submission #{s.resubmission_of}</p>
                  )}
                  {rejectingId === s.id && (
                    <div className="mt-4 p-4 bg-[#FEF3C7] border border-[#FCD34D] rounded-lg">
                      <label className="block text-sm font-semibold text-[#92400E] mb-2">Rejection comment (required)</label>
                      <textarea
                        value={rejectComment}
                        onChange={(e) => setRejectComment(e.target.value)}
                        rows={3}
                        placeholder="Explain what the consultant should fix..."
                        className="block w-full px-3 py-2 border border-[#D0D5DD] rounded-lg text-sm focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => handleReject(s.id)}
                          disabled={!rejectComment.trim()}
                          className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => {
                            setRejectingId(null);
                            setRejectComment('');
                          }}
                          className="px-4 py-2 text-sm font-semibold text-[#344054] border border-[#D0D5DD] rounded-lg hover:bg-[#F9FAFB]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {s.status === 'pending' && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handleApprove(s.id)}
                      className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-[#10B981] rounded-lg hover:bg-[#059669]"
                    >
                      <CheckCircleIcon className="h-5 w-5 mr-2" /> Approve
                    </button>
                    {rejectingId !== s.id ? (
                      <button
                        onClick={() => setRejectingId(s.id)}
                        className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700"
                      >
                        <XCircleIcon className="h-5 w-5 mr-2" /> Reject
                      </button>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
