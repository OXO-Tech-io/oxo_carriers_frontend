'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import {
  DocumentTextIcon,
  PlusIcon,
  DocumentArrowUpIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';
import type { ConsultantWorkSubmission, ConsultantSubmissionStatus } from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000';

export default function WorkSubmissionsPage() {
  const { user, isConsultant } = useAuth();
  const [activeTab, setActiveTab] = useState<'submit' | 'list'>('list');
  const [submissions, setSubmissions] = useState<ConsultantWorkSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    project: '',
    tech: '',
    total_hours: '',
    comment: '',
  });
  const [logSheetFile, setLogSheetFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resubmitId, setResubmitId] = useState<number | null>(null);

  useEffect(() => {
    if (isConsultant) fetchData();
  }, [activeTab, isConsultant]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/consultant-submissions');
      setSubmissions(res.data.submissions || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('project', formData.project.trim());
      fd.append('tech', formData.tech.trim());
      fd.append('total_hours', formData.total_hours);
      fd.append('comment', formData.comment.trim());
      if (logSheetFile) fd.append('log_sheet', logSheetFile);

      if (resubmitId) {
        await api.post(`/consultant-submissions/${resubmitId}/resubmit`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSuccess('Work resubmitted successfully.');
      } else {
        await api.post('/consultant-submissions', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setSuccess('Work submission created. Status: Pending.');
      }
      setResubmitId(null);
      setFormData({ project: '', tech: '', total_hours: '', comment: '' });
      setLogSheetFile(null);
      fetchData();
      setActiveTab('list');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const openResubmit = (s: ConsultantWorkSubmission) => {
    setResubmitId(s.id);
    setFormData({
      project: s.project,
      tech: s.tech,
      total_hours: String(s.total_hours),
      comment: s.comment || '',
    });
    setLogSheetFile(null);
    setActiveTab('submit');
  };

  const getStatusBadge = (status: ConsultantSubmissionStatus) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-700',
      approved: 'bg-emerald-100 text-emerald-700',
      rejected: 'bg-red-100 text-red-700',
    };
    return styles[status] || styles.pending;
  };

  if (!isConsultant) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <p className="text-[#475467]">Access denied. This page is for consultants only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#101828]">Work Submissions</h1>
          <p className="mt-2 text-[#475467]">Submit your work details and log sheet for review</p>
        </div>
        <button
          onClick={() => {
            setResubmitId(null);
            setFormData({ project: '', tech: '', total_hours: '', comment: '' });
            setLogSheetFile(null);
            setActiveTab('submit');
          }}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#465FFF] text-white rounded-xl font-semibold hover:bg-[#3641F5] transition-colors shadow-sm"
        >
          <PlusIcon className="h-5 w-5" />
          <span>New Submission</span>
        </button>
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

      <div className="border-b border-[#E4E7EC]">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('list')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'list' ? 'border-[#465FFF] text-[#465FFF]' : 'border-transparent text-[#475467] hover:text-[#344054] hover:border-[#D0D5DD]'
            }`}
          >
            My Submissions
          </button>
          <button
            onClick={() => setActiveTab('submit')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'submit' ? 'border-[#465FFF] text-[#465FFF]' : 'border-transparent text-[#475467] hover:text-[#344054] hover:border-[#D0D5DD]'
            }`}
          >
            Submit Work
          </button>
        </nav>
      </div>

      {loading ? (
        <div className="flex justify-center min-h-64 items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#465FFF] border-t-transparent" />
        </div>
      ) : activeTab === 'submit' ? (
        <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] p-6 lg:p-8">
          <h2 className="text-xl font-bold text-[#101828] mb-6">
            {resubmitId ? 'Resubmit Work' : 'Submit Work Details'}
          </h2>
          {resubmitId && (
            <p className="text-sm text-[#475467] mb-4">Edit the values below if needed and upload a new log sheet.</p>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-[#344054] mb-2">Which Project *</label>
                <input
                  type="text"
                  required
                  value={formData.project}
                  onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                  placeholder="e.g. HRIS Portal"
                  className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#344054] mb-2">Which Tech *</label>
                <input
                  type="text"
                  required
                  value={formData.tech}
                  onChange={(e) => setFormData({ ...formData, tech: e.target.value })}
                  placeholder="e.g. React, Node.js"
                  className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#344054] mb-2">Total Hours *</label>
              <input
                type="number"
                required
                min={0.5}
                step={0.5}
                value={formData.total_hours}
                onChange={(e) => setFormData({ ...formData, total_hours: e.target.value })}
                className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
                placeholder="e.g. 140.5 or 150 (total only)"
              />
              <p className="mt-1 text-xs text-[#667085]">Enter one total value only (e.g. 140.5, 150)</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#344054] mb-2">Comment</label>
              <textarea
                rows={3}
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Optional notes..."
                className="block w-full px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#101828] focus:outline-none focus:ring-2 focus:ring-[#465FFF] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#344054] mb-2">Upload Log Excel Sheet *</label>
              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                    onChange={(e) => setLogSheetFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                  <div className="flex items-center space-x-2 px-3 py-2.5 border border-[#D0D5DD] rounded-lg text-sm text-[#475467] hover:bg-[#F9FAFB]">
                    <DocumentArrowUpIcon className="h-5 w-5" />
                    <span>{logSheetFile ? logSheetFile.name : 'Choose Excel file'}</span>
                  </div>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const headers = ['Project', 'start_date', 'end_date', 'Total'];
                    const csvContent = '\uFEFF' + headers.join(',') + '\n,,,\n';
                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'work-log-template.csv';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="inline-flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-[#465FFF] hover:text-[#3641F5] border border-[#465FFF] rounded-lg hover:bg-[#ECF3FF] transition-colors"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                  Download template
                </button>
              </div>
              <p className="mt-1 text-xs text-[#667085]">
                Accepted: .xlsx, .xls, .csv. Template columns: Project, start_date, end_date, Total
              </p>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setResubmitId(null);
                  setFormData({ project: '', tech: '', total_hours: '', comment: '' });
                  setLogSheetFile(null);
                }}
                className="px-4 py-2.5 text-sm font-semibold text-[#344054] bg-white border border-[#D0D5DD] rounded-lg hover:bg-[#F9FAFB]"
              >
                {resubmitId ? 'Cancel' : 'Clear'}
              </button>
              <button
                type="submit"
                disabled={submitting || !formData.project.trim() || !formData.tech.trim() || !formData.total_hours || parseFloat(formData.total_hours) <= 0 || !logSheetFile}
                className="px-4 py-2.5 text-sm font-semibold text-white bg-[#465FFF] rounded-lg hover:bg-[#3641F5] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : resubmitId ? 'Resubmit' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-[#E4E7EC] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E4E7EC]">
              <thead className="bg-[#F9FAFB]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase tracking-wider">Project</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase tracking-wider">Tech</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase tracking-wider">Hours</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-[#344054] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#E4E7EC]">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <DocumentTextIcon className="h-12 w-12 text-[#98A2B3] mx-auto mb-4" />
                      <p className="text-sm font-medium text-[#344054]">No work submissions yet</p>
                      <button
                        onClick={() => setActiveTab('submit')}
                        className="mt-2 text-sm font-medium text-[#465FFF] hover:text-[#3641F5]"
                      >
                        Submit work
                      </button>
                    </td>
                  </tr>
                ) : (
                  submissions.map((s) => (
                    <tr key={s.id} className="hover:bg-[#F9FAFB]">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#101828]">{s.project}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#344054]">{s.tech}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#101828]">{s.total_hours}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(s.status)}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475467]">{new Date(s.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <a
                            href={`${API_BASE}${s.log_sheet_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-sm text-[#465FFF] hover:text-[#3641F5]"
                          >
                            <DocumentArrowUpIcon className="h-4 w-4 mr-1" /> Log sheet
                          </a>
                          {s.status === 'rejected' && (
                            <>
                              {s.admin_comment && (
                                <p className="text-xs text-red-600 mt-1">Admin: {s.admin_comment}</p>
                              )}
                              {!submissions.some((other) => other.resubmission_of === s.id) && (
                                <button
                                  type="button"
                                  onClick={() => openResubmit(s)}
                                  className="inline-flex items-center mt-1 text-sm font-medium text-[#465FFF] hover:text-[#3641F5]"
                                >
                                  <ArrowPathIcon className="h-4 w-4 mr-1" /> Resubmit
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
