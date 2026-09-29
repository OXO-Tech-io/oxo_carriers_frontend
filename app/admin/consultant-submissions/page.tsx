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
import { API_FILE_BASE_URL as API_BASE } from '@/lib/constants';
import type { ConsultantWorkSubmission, ConsultantSubmissionStatus } from '@/types';

export default function AdminConsultantSubmissionsPage() {
  const { isHR, isSuperAdmin } = useAuth();
  const canAccess = isHR || isSuperAdmin;
  const [submissions, setSubmissions] = useState<ConsultantWorkSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState<ConsultantSubmissionStatus | ''>('');
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectComment, setRejectComment] = useState('');

  useEffect(() => {
    if (canAccess) fetchSubmissions();
  }, [canAccess, filterStatus]);

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
      await api.put(`/consultant-submissions/${id}/decisions`, { action: 'approve' });
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
      await api.put(`/consultant-submissions/${id}/decisions`, { action: 'reject', admin_comment: rejectComment.trim() });
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
      pending: 'bg-[var(--warning-light)] text-[var(--warning-text)]',
      approved: 'bg-[var(--success-light)] text-[var(--success-text)]',
      rejected: 'bg-[var(--error-light)] text-[var(--error-text)]',
    };
    return styles[status] || styles.pending;
  };

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-[var(--gray-400)]">Access denied.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">Consultant Work Submissions</h1>
        <p className="mt-2 text-[var(--gray-400)]">Review and approve or reject consultant work submissions</p>
      </div>

      {error && (
        <div className="bg-[var(--error-light)] border-l-4 border-[var(--error)] text-[var(--error-text)] p-4 rounded-lg">
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="bg-[var(--success-light)] border-l-4 border-[var(--success)] text-[var(--success-text)] p-4 rounded-lg">
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs font-medium text-[var(--gray-400)] mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ConsultantSubmissionStatus | '')}
            className="block w-full min-w-[120px] px-3 py-2 border border-[var(--gray-200)] rounded-lg text-sm bg-[var(--card-bg)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
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
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--primary)] border-t-transparent" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-[var(--card-bg)] rounded-2xl shadow-sm border border-[var(--gray-100)] p-12 text-center">
          <DocumentTextIcon className="h-12 w-12 text-[var(--gray-300)] mx-auto mb-4" />
          <p className="text-sm font-medium text-[var(--gray-600)]">No consultant submissions found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((s) => (
            <div
              key={s.id}
              className="bg-[var(--card-bg)] rounded-2xl shadow-sm border border-[var(--gray-100)] p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="p-2 rounded-lg bg-[var(--primary-light)]">
                      <UserIcon className="h-5 w-5 text-[var(--primary)]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--foreground)]">
                        {s.user?.first_name} {s.user?.last_name}
                      </p>
                      <p className="text-xs text-[var(--gray-400)]">{s.user?.email} · {s.user?.employee_id}</p>
                      {s.user?.hourly_rate != null && (
                        <p className="text-xs text-[var(--gray-400)]">Hourly rate: {s.user.hourly_rate}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-[var(--gray-300)] mb-1">Project</p>
                      <p className="text-sm font-semibold text-[var(--gray-600)]">{s.project}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--gray-300)] mb-1">Tech</p>
                      <p className="text-sm font-semibold text-[var(--gray-600)]">{s.tech}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--gray-300)] mb-1">Total Hours</p>
                      <p className="text-sm font-semibold text-[var(--gray-600)]">{s.total_hours}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--gray-300)] mb-1">Status</p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(s.status)}`}>
                        {s.status}
                      </span>
                    </div>
                  </div>
                  {s.comment && (
                    <div className="mb-4">
                      <p className="text-xs text-[var(--gray-300)] mb-1">Comment</p>
                      <p className="text-sm text-[var(--gray-400)]">{s.comment}</p>
                    </div>
                  )}
                  <div className="mb-2">
                    <a
                      href={`${API_BASE}${s.log_sheet_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-[var(--primary)] hover:text-[var(--primary-hover)]"
                    >
                      <DocumentArrowUpIcon className="h-4 w-4 mr-1" /> View log sheet
                    </a>
                  </div>
                  {s.resubmission_of && (
                    <p className="text-xs text-[var(--gray-400)]">Resubmission of submission #{s.resubmission_of}</p>
                  )}
                  {rejectingId === s.id && (
                    <div className="mt-4 p-4 bg-[var(--warning-light)] border border-[var(--warning-text)]/30 rounded-lg">
                      <label className="block text-sm font-semibold text-[var(--warning-text)] mb-2">Rejection comment (required)</label>
                      <textarea
                        value={rejectComment}
                        onChange={(e) => setRejectComment(e.target.value)}
                        rows={3}
                        placeholder="Explain what the consultant should fix..."
                        className="block w-full px-3 py-2 border border-[var(--gray-200)] rounded-lg text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
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
                          className="px-4 py-2 text-sm font-semibold text-[var(--gray-600)] border border-[var(--gray-200)] rounded-lg hover:bg-[var(--gray-25)]"
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
                      className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-[var(--success)] rounded-lg hover:opacity-90"
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
