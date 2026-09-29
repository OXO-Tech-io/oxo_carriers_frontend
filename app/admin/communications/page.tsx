'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import {
  Download,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Trash2,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCommunicationsQuery } from '@/hooks/queries/use-communications-query';
import { useCreateCommunicationMutation, useDeleteCommunicationMutation } from '@/hooks/mutations/use-communication-mutations';
import { communicationService } from '@/lib/services/communication.service';
import { Modal, Button, DataTable, FileUpload, RecipientPicker, Badge, ConfirmationDialog } from '@/components/ui';
import { resolveFileUrl } from '@/lib/constants';
import type { Communication } from '@/types/hrModules';

// OCD-525: pick a rough type icon for an attachment - image vs. everything else
// (Word/PDF/Excel/CSV).
const attachmentIcon = (mimeType: string) => (mimeType?.startsWith('image/') ? ImageIcon : FileText);

const ATTACHMENT_ACCEPT =
  'image/jpeg,image/png,image/jpg,image/gif,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv';

export default function AdminCommunicationsPage() {
  const { isHRManager, isSuperAdmin } = useAuth();
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
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  // OCD-523: per-field "has the user interacted with this yet" flags, plus a
  // submit-attempt flag - inline errors show once a field is touched (blur,
  // or any change for the recipients picker, which has no blur of its own)
  // or once a Send click has failed validation, not on every keystroke.
  const [touched, setTouched] = useState({ title: false, body: false, deadline: false, recipients: false });
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const communicationsQuery = useCommunicationsQuery();
  const createMutation = useCreateCommunicationMutation();
  const deleteMutation = useDeleteCommunicationMutation();

  // OCD-515: pinned once per mount rather than recomputed on every render, so
  // the `min` attribute (and the "in the past" check) don't creep forward
  // while the modal sits open.
  const nowLocal = useMemo(() => new Date().toISOString().slice(0, 16), []);

  if (!isHRManager && !isSuperAdmin) {
    return <p className="text-sm text-[var(--gray-400)]">You do not have access to this page.</p>;
  }

  const trimmedTitle = title.trim();
  const trimmedBody = body.trim();
  const hasRecipients = recipientIds.length > 0 || recipientGroupIds.length > 0;
  const deadlineMissing = requiresAcknowledgement && deadlineAt === '';
  const deadlineInPast = requiresAcknowledgement && deadlineAt !== '' && deadlineAt < nowLocal;
  const canSend = trimmedTitle.length > 0 && trimmedBody.length > 0 && hasRecipients && !deadlineMissing && !deadlineInPast;

  const markTouched = (field: keyof typeof touched) => setTouched((prev) => ({ ...prev, [field]: true }));

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setSubmitAttempted(false);
    setTouched({ title: false, body: false, deadline: false, recipients: false });
  };

  const handleDelete = async () => {
    if (!isSuperAdmin || !deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget);
    setDeleteTarget(null);
  };

  const handleGroupIdsChange = (ids: number[]) => {
    setRecipientGroupIds(ids);
    markTouched('recipients');
  };

  const handleUserIdsChange = (ids: number[]) => {
    setRecipientIds(ids);
    markTouched('recipients');
  };

  const handleCreate = async () => {
    setSubmitAttempted(true);
    if (!canSend) return;
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
    setSubmitAttempted(false);
    setTouched({ title: false, body: false, deadline: false, recipients: false });
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
        <Badge variant={row.original.requiresAcknowledgement ? 'info' : 'gray'}>
          {row.original.requiresAcknowledgement ? 'Yes' : 'No'}
        </Badge>
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
              onClick={() => setDeleteTarget(row.original.id)}
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
      <Modal isOpen={showCreateModal} onClose={closeCreateModal} title="New Communication" size="lg">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-[var(--foreground)]">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => markTouched('title')}
              placeholder="e.g. Updated Office Health & Safety Guidelines"
              className="mt-1 w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-2.5 text-sm text-[var(--foreground)]"
            />
            {(touched.title || submitAttempted) && trimmedTitle.length === 0 && (
              <p className="mt-1 text-xs text-red-500">Subject is required.</p>
            )}
          </div>
          <div>
            <label className="text-sm font-semibold text-[var(--foreground)]">
              Message <span className="text-red-500">*</span>
            </label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onBlur={() => markTouched('body')}
              rows={4}
              placeholder="Write your communication message here..."
              className="mt-1 w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-2.5 text-sm text-[var(--foreground)]"
            />
            {(touched.body || submitAttempted) && trimmedBody.length === 0 && (
              <p className="mt-1 text-xs text-red-500">Message is required.</p>
            )}
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
                  Acknowledgement Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={deadlineAt}
                  min={nowLocal}
                  onChange={(e) => setDeadlineAt(e.target.value)}
                  onBlur={() => markTouched('deadline')}
                  className="w-full rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-2 text-sm text-[var(--foreground)]"
                />
                {(touched.deadline || submitAttempted) && deadlineMissing && (
                  <p className="mt-1 text-xs text-red-500">
                    Acknowledgement deadline is required when recipient acknowledgement is enabled.
                  </p>
                )}
                {(touched.deadline || submitAttempted) && !deadlineMissing && deadlineInPast && (
                  <p className="mt-1 text-xs text-red-500">Acknowledgement deadline cannot be in the past.</p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-[var(--foreground)]">Attachments</label>
            <div className="mt-1">
              <FileUpload
                multiple
                onFilesSelected={setFiles}
                accept={ATTACHMENT_ACCEPT}
                typeErrorMessage="Unsupported file type. Please upload a JPG, PNG, Word, PDF, or spreadsheet file."
              />
              <p className="mt-1.5 text-xs text-[var(--gray-400)]">
                Supported file types: JPG, PNG, GIF, PDF, Word (.doc/.docx), and Excel/CSV spreadsheets.
              </p>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-[var(--foreground)]">
              Recipients <span className="text-red-500">*</span>
            </label>
            <div className="mt-1">
              <RecipientPicker
                selectedGroupIds={recipientGroupIds}
                onGroupIdsChange={handleGroupIdsChange}
                selectedUserIds={recipientIds}
                onUserIdsChange={handleUserIdsChange}
                onGroupMemberIdsChange={setGroupMemberIds}
              />
            </div>
            {(touched.recipients || submitAttempted) && !hasRecipients && (
              <p className="mt-1 text-xs text-red-500">Select at least one group or individual recipient.</p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={closeCreateModal}>
              Cancel
            </Button>
            <Button onClick={handleCreate} isLoading={createMutation.isPending} disabled={!canSend}>
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
              <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap break-words bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                {selectedCommunication.body}
              </p>
              {/* OCD-525: attachments uploaded with this communication */}
              {selectedCommunication.attachments && selectedCommunication.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedCommunication.attachments.map((attachment, index) => {
                    const Icon = attachmentIcon(attachment.mimeType);
                    return (
                      <a
                        key={`${attachment.fileUrl}-${index}`}
                        href={resolveFileUrl(attachment.fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border border-[var(--gray-100)] bg-[var(--gray-25)] px-2.5 py-1.5 text-xs font-semibold text-[var(--primary)] hover:underline"
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate max-w-[200px]">{attachment.fileName}</span>
                      </a>
                    );
                  })}
                </div>
              )}
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

                  let statusBadge = <Badge variant="gray">Delivered</Badge>;

                  if (selectedCommunication.requiresAcknowledgement) {
                    if (r.isAcknowledged) {
                      if (r.isLate) {
                        statusBadge = (
                          <Badge variant="warning" icon={<Clock className="h-3 w-3" />}>
                            Acknowledged (Late)
                          </Badge>
                        );
                      } else {
                        statusBadge = (
                          <Badge variant="success" icon={<CheckCircle2 className="h-3 w-3" />}>
                            Acknowledged (On-Time)
                          </Badge>
                        );
                      }
                    } else if (deadlinePassed) {
                      statusBadge = (
                        <Badge variant="error" icon={<AlertCircle className="h-3 w-3" />}>
                          Overdue (Unacknowledged)
                        </Badge>
                      );
                    } else {
                      statusBadge = (
                        <Badge variant="info" icon={<Clock className="h-3 w-3" />}>
                          Pending Acknowledgement
                        </Badge>
                      );
                    }
                  }

                  return (
                    <div key={r.id} className="p-3 flex items-center justify-between gap-4 text-xs">
                      <div>
                        <p className="font-semibold text-[var(--foreground)]">{r.name}</p>
                        <p className="text-[var(--gray-400)]">{r.email}</p>
                        {r.responseText && (
                          <p className="mt-1 italic text-[var(--gray-400)] break-words">Note: "{r.responseText}"</p>
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

      <ConfirmationDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Communication"
        message="Are you sure you want to delete this communication? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
