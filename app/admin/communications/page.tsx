'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Download, Eye, Clock, CheckCircle2, AlertCircle, Calendar, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCommunicationsQuery } from '@/hooks/queries/use-communications-query';
import { useCreateCommunicationMutation, useDeleteCommunicationMutation } from '@/hooks/mutations/use-communication-mutations';
import { communicationService } from '@/lib/services/communication.service';
import { Modal, Button, DataTable, FileUpload, RecipientPicker } from '@/components/ui';
import type { Communication } from '@/types/hrModules';

export default function AdminCommunicationsPage() {
  const { isHR, isHRManager, isSuperAdmin } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [requiresAcknowledgement, setRequiresAcknowledgement] = useState(false);
  const [deadlineAt, setDeadlineAt] = useState('');
  const [recipientIds, setRecipientIds] = useState<number[]>([]);
  const [recipientGroupIds, setRecipientGroupIds] = useState<number[]>([]);
  const [groupMemberIds, setGroupMemberIds] = useState<number[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedCommunication, setSelectedCommunication] = useState<Communication | null>(null);

  const communicationsQuery = useCommunicationsQuery();
  const createMutation = useCreateCommunicationMutation();
  const deleteMutation = useDeleteCommunicationMutation();

  if (!isHR && !isSuperAdmin) {
    return <p className="text-sm text-[var(--gray-400)]">You do not have access to this page.</p>;
  }

  const handleDelete = async (id: number) => {
    if (!isSuperAdmin) return;
    if (window.confirm('Are you sure you want to delete this communication? This action cannot be undone.')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const handleCreate = async () => {
    if (!title.trim() || !body.trim() || (recipientIds.length === 0 && recipientGroupIds.length === 0)) return;
    const resolvedUserIds = [...new Set([...recipientIds, ...groupMemberIds])];
    await createMutation.mutateAsync({
      title,
      body,
      recipientUserIds: resolvedUserIds,
      recipientGroupIds: [],
      files,
      requiresAcknowledgement,
      deadlineAt: deadlineAt || null,
    });
    setTitle('');
    setBody('');
    setRequiresAcknowledgement(false);
    setDeadlineAt('');
    setRecipientIds([]);
    setRecipientGroupIds([]);
    setGroupMemberIds([]);
    setFiles([]);
    setShowCreateModal(false);
  };

  const handleDownloadReport = async () => {
    const blob = await communicationService.downloadReport();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'communications-report.xlsx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const columns: ColumnDef<Communication, any>[] = [
    { accessorKey: 'title', header: 'Subject' },
    {
      accessorKey: 'createdAt',
      header: 'Sent',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
    },
    {
      accessorKey: 'requiresAcknowledgement',
      header: 'Ack Required',
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            row.original.requiresAcknowledgement
              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          }`}
        >
          {row.original.requiresAcknowledgement ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      accessorKey: 'deadlineAt',
      header: 'Deadline',
      cell: ({ row }) =>
        row.original.deadlineAt ? (
          <span className="text-xs text-[var(--foreground)] flex items-center gap-1">
            <Clock className="h-3 w-3 text-amber-500" />
            {new Date(row.original.deadlineAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
          </span>
        ) : (
          <span className="text-xs text-[var(--gray-400)]">-</span>
        ),
    },
    {
      header: 'Acknowledgement Summary',
      cell: ({ row }) => {
        const c = row.original;
        if (!c.requiresAcknowledgement) {
          return <span className="text-xs text-[var(--gray-400)]">N/A (Optional)</span>;
        }
        const total = c.totalRecipients || 0;
        const acked = c.acknowledgedCount || 0;
        const onTime = c.onTimeCount || 0;
        const late = c.lateCount || 0;

        return (
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2 text-xs font-semibold">
              <span className="text-[var(--foreground)]">
                {acked} / {total} Acknowledged
              </span>
              <span className="text-emerald-600 dark:text-emerald-400">
                {onTime} on-time{late > 0 ? `, ${late} late` : ''}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden flex">
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${total ? (onTime / total) * 100 : 0}%` }}
              />
              <div
                className="bg-amber-500 h-full transition-all"
                style={{ width: `${total ? (late / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Eye className="h-3.5 w-3.5" />}
            onClick={() => setSelectedCommunication(row.original)}
          >
            View Summary
          </Button>
          {isSuperAdmin && (
            <Button
              size="sm"
              variant="ghost"
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              leftIcon={<Trash2 className="h-3.5 w-3.5 text-rose-500" />}
              onClick={() => handleDelete(row.original.id)}
              isLoading={deleteMutation.isPending}
            >
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Communications</h1>
          <p className="text-[var(--gray-400)]">Send employee communications and track responses</p>
        </div>
        <div className="flex gap-2">
          {(isHRManager || isSuperAdmin) && (
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={handleDownloadReport}>
              Download Report
            </Button>
          )}
          <Button onClick={() => setShowCreateModal(true)}>New Communication</Button>
        </div>
      </div>

      <DataTable columns={columns} data={communicationsQuery.data ?? []} isLoading={communicationsQuery.isLoading} />

      {/* New Communication Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Communication" size="lg">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-[var(--foreground)]">Subject</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Updated Office Health & Safety Guidelines"
              className="mt-1 w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-2.5 text-sm text-[var(--foreground)]"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-[var(--foreground)]">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Write your communication message here..."
              className="mt-1 w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-2.5 text-sm text-[var(--foreground)]"
            />
          </div>

          <div className="rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-3.5 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={requiresAcknowledgement}
                onChange={(e) => setRequiresAcknowledgement(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                Require Recipient Acknowledgement
              </span>
            </label>

            {requiresAcknowledgement && (
              <div className="pt-2 animate-fade-in">
                <label className="text-xs font-medium text-[var(--gray-400)] flex items-center gap-1.5 mb-1">
                  <Calendar className="h-3.5 w-3.5 text-amber-500" />
                  Acknowledgement Deadline (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={deadlineAt}
                  onChange={(e) => setDeadlineAt(e.target.value)}
                  className="w-full rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-2 text-sm text-[var(--foreground)]"
                />
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-[var(--foreground)]">Attachments</label>
            <div className="mt-1">
              <FileUpload multiple onFilesSelected={setFiles} />
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-[var(--foreground)]">Recipients</label>
            <div className="mt-1">
              <RecipientPicker
                selectedGroupIds={recipientGroupIds}
                onGroupIdsChange={setRecipientGroupIds}
                selectedUserIds={recipientIds}
                onUserIdsChange={setRecipientIds}
                onGroupMemberIdsChange={setGroupMemberIds}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} isLoading={createMutation.isPending}>
              Send
            </Button>
          </div>
        </div>
      </Modal>

      {/* Recipient Details & Summary Modal */}
      <Modal
        isOpen={!!selectedCommunication}
        onClose={() => setSelectedCommunication(null)}
        title="Communication Summary & Recipients"
        size="lg"
      >
        {selectedCommunication && (
          <div className="space-y-5">
            <div className="rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-4 space-y-2">
              <h3 className="text-base font-bold text-[var(--foreground)]">{selectedCommunication.title}</h3>
              <p className="text-xs text-[var(--gray-400)] flex items-center gap-3">
                <span>Sent: {new Date(selectedCommunication.createdAt).toLocaleString()}</span>
                {selectedCommunication.requiresAcknowledgement && (
                  <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Ack Required
                  </span>
                )}
                {selectedCommunication.deadlineAt && (
                  <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> Deadline: {new Date(selectedCommunication.deadlineAt).toLocaleString()}
                  </span>
                )}
              </p>
              <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                {selectedCommunication.body}
              </p>
            </div>

            {selectedCommunication.requiresAcknowledgement && (
              <div className="grid grid-cols-4 gap-3">
                <div className="rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-3 text-center">
                  <p className="text-xs text-[var(--gray-400)]">Total Sent</p>
                  <p className="text-xl font-bold text-[var(--foreground)]">{selectedCommunication.totalRecipients || 0}</p>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 text-center">
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Ack (On-Time)</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{selectedCommunication.onTimeCount || 0}</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 p-3 text-center">
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">Ack (Late)</p>
                  <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{selectedCommunication.lateCount || 0}</p>
                </div>
                <div className="rounded-xl border border-rose-200 bg-rose-50/50 dark:bg-rose-950/20 p-3 text-center">
                  <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">Pending</p>
                  <p className="text-xl font-bold text-rose-600 dark:text-rose-400">{selectedCommunication.pendingCount || 0}</p>
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-[var(--foreground)] mb-2">Recipient Status Breakdown</h4>
              <div className="max-h-64 overflow-y-auto rounded-xl border border-[var(--gray-200)] divide-y divide-[var(--gray-100)]">
                {selectedCommunication.recipients?.map((r) => {
                  const deadlinePassed =
                    selectedCommunication.deadlineAt && new Date() > new Date(selectedCommunication.deadlineAt);

                  let statusBadge = (
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600">
                      Delivered
                    </span>
                  );

                  if (selectedCommunication.requiresAcknowledgement) {
                    if (r.isAcknowledged) {
                      if (r.isLate) {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                            <Clock className="h-3 w-3" /> Acknowledged (Late)
                          </span>
                        );
                      } else {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                            <CheckCircle2 className="h-3 w-3" /> Acknowledged (On-Time)
                          </span>
                        );
                      }
                    } else if (deadlinePassed) {
                      statusBadge = (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                          <AlertCircle className="h-3 w-3" /> Overdue (Unacknowledged)
                        </span>
                      );
                    } else {
                      statusBadge = (
                        <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                          <Clock className="h-3 w-3" /> Pending Acknowledgement
                        </span>
                      );
                    }
                  }

                  return (
                    <div key={r.id} className="p-3 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <p className="font-semibold text-[var(--foreground)]">{r.name}</p>
                        <p className="text-[var(--gray-400)]">{r.email}</p>
                        {r.responseText && (
                          <p className="mt-1 italic text-[var(--gray-400)]">Note: "{r.responseText}"</p>
                        )}
                      </div>
                      <div className="text-right space-y-1">
                        <div>{statusBadge}</div>
                        <p className="text-[var(--gray-400)]">
                          {r.respondedAt
                            ? `Ack: ${new Date(r.respondedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}`
                            : 'No response'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setSelectedCommunication(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
