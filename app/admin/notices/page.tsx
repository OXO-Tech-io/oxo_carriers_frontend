'use client';

import { useEffect, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Eye, ImageOff, Megaphone, Trash2, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useManageNoticesQuery } from '@/hooks/queries/use-notices-query';
import {
  useCreateNoticeMutation,
  useUpdateNoticeMutation,
  useDeleteNoticeMutation,
} from '@/hooks/mutations/use-notice-mutations';
import { Modal, Button, Badge, DataTable, ConfirmationDialog, type BadgeVariant } from '@/components/ui';
import { FileUpload } from '@/components/ui/FileUpload';
import { resolveFileUrl as resolveImageUrl, DATE_FORMATS } from '@/lib/constants';
import type { Notice } from '@/types/hrModules';

const TITLE_MAX_LENGTH = 100;
const MESSAGE_MAX_LENGTH = 1000;

const emptyDraft = {
  title: '',
  message: '',
  isActive: true,
  image: null as File | null,
  removeImage: false,
  startAt: '',
  endAt: '',
};

/** Converts an ISO timestamp to the local value a `datetime-local` input
 * expects ("yyyy-MM-ddThh:mm"), in the viewer's own timezone. */
const toDateTimeLocalValue = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

/** Converts a `datetime-local` input value (local time, no timezone) back
 * into an ISO timestamp for the API. */
const fromDateTimeLocalValue = (value: string): string | null => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

type ScheduleStatus = 'scheduled' | 'live' | 'expired';

/** isActive is a manual kill-switch; this is the separate question of
 * whether "now" actually falls inside the notice's [startAt, endAt] window. */
const getScheduleStatus = (notice: Notice, now: Date = new Date()): ScheduleStatus => {
  const start = new Date(notice.startAt);
  const end = notice.endAt ? new Date(notice.endAt) : null;
  if (!Number.isNaN(start.getTime()) && now < start) return 'scheduled';
  if (end && !Number.isNaN(end.getTime()) && now > end) return 'expired';
  return 'live';
};

const scheduleLabels: Record<ScheduleStatus, { label: string; variant: BadgeVariant }> = {
  scheduled: { label: 'Scheduled', variant: 'info' },
  live: { label: 'Live', variant: 'success' },
  expired: { label: 'Expired', variant: 'gray' },
};

const formatScheduleDate = (iso: string | null | undefined) => {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : format(date, DATE_FORMATS.COMPACT_WITH_TIME);
};

export default function AdminNoticesPage() {
  const { isHR, isSuperAdmin } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [deleteTarget, setDeleteTarget] = useState<Notice | null>(null);
  const [statusChangeTarget, setStatusChangeTarget] = useState<{ id: number; title: string; nextIsActive: boolean } | null>(
    null,
  );
  const [viewTarget, setViewTarget] = useState<Notice | null>(null);

  const noticesQuery = useManageNoticesQuery(isHR || isSuperAdmin);
  const createMutation = useCreateNoticeMutation();
  const updateMutation = useUpdateNoticeMutation();
  const deleteMutation = useDeleteNoticeMutation();

  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  useEffect(() => {
    if (!draft.image) {
      setNewImagePreview(null);
      return;
    }
    const url = URL.createObjectURL(draft.image);
    setNewImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [draft.image]);

  const existingImageUrl =
    editingNotice?.imageUrl && !draft.removeImage ? resolveImageUrl(editingNotice.imageUrl) : null;
  const imagePreviewUrl = newImagePreview ?? existingImageUrl;

  if (!isHR && !isSuperAdmin) {
    return <p className="text-sm text-[var(--gray-400)]">You do not have access to this page.</p>;
  }

  const openCreate = () => {
    setEditingNotice(null);
    setDraft({ ...emptyDraft, startAt: toDateTimeLocalValue(new Date().toISOString()) });
    setShowModal(true);
  };

  const openEdit = (notice: Notice) => {
    setEditingNotice(notice);
    setDraft({
      title: notice.title,
      message: notice.message,
      isActive: notice.isActive,
      image: null,
      removeImage: false,
      startAt: toDateTimeLocalValue(notice.startAt),
      endAt: toDateTimeLocalValue(notice.endAt),
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingNotice(null);
    setDraft(emptyDraft);
  };

  const titleOverLimit = draft.title.length > TITLE_MAX_LENGTH;
  const messageOverLimit = draft.message.length > MESSAGE_MAX_LENGTH;
  // datetime-local values are zero-padded "yyyy-MM-ddThh:mm" strings, so they
  // sort lexicographically the same way they sort chronologically.
  const scheduleError =
    draft.startAt && draft.endAt && draft.endAt < draft.startAt
      ? 'End date/time must be on or after the start date/time.'
      : null;
  const canSave =
    !!draft.title.trim() &&
    !!draft.message.trim() &&
    !titleOverLimit &&
    !messageOverLimit &&
    !!draft.startAt &&
    !!draft.endAt &&
    !scheduleError;

  const handleSave = async () => {
    if (!canSave) return;
    const startAtIso = fromDateTimeLocalValue(draft.startAt);
    if (!startAtIso) return;
    const endAtIso = fromDateTimeLocalValue(draft.endAt);
    if (!endAtIso) return;

    if (editingNotice) {
      await updateMutation.mutateAsync({
        id: editingNotice.id,
        input: {
          title: draft.title,
          message: draft.message,
          isActive: draft.isActive,
          image: draft.image,
          removeImage: draft.removeImage,
          startAt: startAtIso,
          endAt: endAtIso,
        },
      });
    } else {
      await createMutation.mutateAsync({
        title: draft.title,
        message: draft.message,
        isActive: draft.isActive,
        image: draft.image,
        startAt: startAtIso,
        endAt: endAtIso,
      });
    }
    closeModal();
  };

  const handleImageSelected = (files: File[]) => {
    setDraft((prev) => ({ ...prev, image: files[0] ?? null, removeImage: false }));
  };

  const handleRemoveImage = () => {
    setDraft((prev) => (prev.image ? { ...prev, image: null } : { ...prev, removeImage: true }));
  };

  const requestStatusChange = (notice: Notice) => {
    setStatusChangeTarget({ id: notice.id, title: notice.title, nextIsActive: !notice.isActive });
  };

  const handleConfirmStatusChange = async () => {
    if (!statusChangeTarget) return;
    await updateMutation.mutateAsync({
      id: statusChangeTarget.id,
      input: { isActive: statusChangeTarget.nextIsActive },
    });
    setStatusChangeTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const columns: ColumnDef<Notice, any>[] = [
    {
      id: 'image',
      header: '',
      cell: ({ row }) =>
        row.original.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolveImageUrl(row.original.imageUrl)}
            alt=""
            className="h-10 w-14 rounded-lg object-cover border border-[var(--gray-100)]"
          />
        ) : (
          <div className="flex h-10 w-14 items-center justify-center rounded-lg bg-[var(--gray-50)] text-[var(--gray-300)]">
            <ImageOff className="h-4 w-4" />
          </div>
        ),
    },
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <span className="block max-w-[220px] truncate" title={row.original.title}>
          {row.original.title}
        </span>
      ),
    },
    {
      accessorKey: 'message',
      header: 'Message',
      cell: ({ row }) => (
        <span className="line-clamp-2 max-w-md text-[var(--gray-500)]">{row.original.message}</span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? 'success' : 'gray'}>
          {row.original.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      id: 'schedule',
      header: 'Schedule',
      cell: ({ row }) => {
        const notice = row.original;
        const status = getScheduleStatus(notice);
        const { label, variant } = scheduleLabels[status];
        const startLabel = formatScheduleDate(notice.startAt) ?? '—';
        const endLabel = formatScheduleDate(notice.endAt);
        return (
          <div className="space-y-1">
            <Badge variant={variant}>{label}</Badge>
            <p className="text-[11px] text-[var(--gray-400)] whitespace-nowrap">
              {startLabel} {'→'} {endLabel ?? 'No end date'}
            </p>
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewTarget(row.original)}
            className="p-1.5 text-[var(--gray-500)] hover:bg-[var(--gray-50)] rounded-lg"
            aria-label="View notice"
            title="View"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            onClick={() => openEdit(row.original)}
            className="text-sm font-semibold text-[var(--primary)] hover:underline"
          >
            Edit
          </button>
          {/* Fixed-width wrapper so Delete lands in the same spot regardless of
              whether this button reads "Activate" or "Deactivate" (OCD-571). */}
          <div className="w-20 flex justify-center">
            <button
              onClick={() => requestStatusChange(row.original)}
              className="text-sm font-semibold text-[var(--gray-500)] hover:underline"
            >
              {row.original.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
          <button
            onClick={() => setDeleteTarget(row.original)}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
            aria-label="Delete notice"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Notice Board</h1>
          <p className="text-[var(--gray-400)]">
            Create and manage announcements shown to every employee and system user on their dashboard.
          </p>
        </div>
        <Button onClick={openCreate}>Create Notice</Button>
      </div>

      <DataTable columns={columns} data={noticesQuery.data ?? []} isLoading={noticesQuery.isLoading} />

      <Modal isOpen={showModal} onClose={closeModal} title={editingNotice ? 'Edit Notice' : 'Create Notice'} size="md">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-[var(--foreground)]">Title</label>
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="e.g. Office closed on Friday"
              maxLength={TITLE_MAX_LENGTH}
              className="mt-1 w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-2.5 text-sm text-[var(--foreground)]"
            />
            <p
              className={`mt-1 text-right text-[11px] ${
                titleOverLimit ? 'font-semibold text-red-500' : 'text-[var(--gray-400)]'
              }`}
            >
              {draft.title.length} / {TITLE_MAX_LENGTH}
            </p>
          </div>
          <div>
            <label className="text-sm font-semibold text-[var(--foreground)]">Message</label>
            <textarea
              value={draft.message}
              onChange={(e) => setDraft({ ...draft, message: e.target.value })}
              rows={4}
              placeholder="Notice details..."
              maxLength={MESSAGE_MAX_LENGTH}
              className="mt-1 w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-2.5 text-sm text-[var(--foreground)]"
            />
            <p
              className={`mt-1 text-right text-[11px] ${
                messageOverLimit ? 'font-semibold text-red-500' : 'text-[var(--gray-400)]'
              }`}
            >
              {draft.message.length} / {MESSAGE_MAX_LENGTH}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="notice-start-at" className="text-sm font-semibold text-[var(--foreground)]">
                Start Date &amp; Time
              </label>
              <input
                id="notice-start-at"
                type="datetime-local"
                required
                value={draft.startAt}
                onChange={(e) => setDraft({ ...draft, startAt: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-2.5 text-sm text-[var(--foreground)]"
              />
            </div>
            <div>
              <label htmlFor="notice-end-at" className="text-sm font-semibold text-[var(--foreground)]">
                End Date &amp; Time
              </label>
              <input
                id="notice-end-at"
                type="datetime-local"
                required
                value={draft.endAt}
                onChange={(e) => setDraft({ ...draft, endAt: e.target.value })}
                className="mt-1 w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-2.5 text-sm text-[var(--foreground)]"
              />
            </div>
          </div>
          {scheduleError && <p className="text-xs font-medium text-red-500">{scheduleError}</p>}
          <div>
            <label className="text-sm font-semibold text-[var(--foreground)]">Image (optional)</label>
            <p className="text-xs text-[var(--gray-400)] mb-1.5">
              Shown as a banner on the notice card on everyone&apos;s dashboard.
            </p>
            {imagePreviewUrl ? (
              <div className="relative overflow-hidden rounded-xl border border-[var(--gray-200)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreviewUrl} alt="" className="h-40 w-full object-cover" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
                  aria-label="Remove image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <FileUpload
                accept="image/jpeg,image/png,image/gif"
                maxSizeMB={5}
                onFilesSelected={handleImageSelected}
                typeErrorMessage="Unsupported file type. Only JPG, PNG, and GIF images are allowed for the notice image."
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={draft.isActive}
              onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })}
              className="h-4 w-4 text-[var(--primary)] border-[var(--gray-200)] rounded"
            />
            <label htmlFor="isActive" className="text-sm font-semibold text-[var(--foreground)] cursor-pointer select-none">
              Active (visible on everyone&apos;s dashboard)
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleSave} isLoading={isSaving} disabled={!canSave}>
              {editingNotice ? 'Save' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmationDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Notice"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />

      <ConfirmationDialog
        isOpen={!!statusChangeTarget}
        onClose={() => setStatusChangeTarget(null)}
        onConfirm={handleConfirmStatusChange}
        title={statusChangeTarget?.nextIsActive ? 'Activate Notice' : 'Deactivate Notice'}
        message={`Are you sure you want to ${statusChangeTarget?.nextIsActive ? 'activate' : 'deactivate'} this notice?`}
        confirmLabel={statusChangeTarget?.nextIsActive ? 'Activate' : 'Deactivate'}
        isLoading={updateMutation.isPending}
      />

      <Modal
        isOpen={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="Notice Preview"
        size="md"
        footer={
          <Button variant="outline" onClick={() => setViewTarget(null)}>
            Close
          </Button>
        }
      >
        {viewTarget && (
          <div className="space-y-4">
            <p className="text-xs font-medium text-[var(--gray-400)]">
              This is a read-only preview of how this notice appears to recipients.
            </p>
            <div className="rounded-2xl border border-[var(--gray-100)] overflow-hidden">
              {viewTarget.imageUrl && (
                <div className="overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolveImageUrl(viewTarget.imageUrl)}
                    alt=""
                    className="h-40 w-full object-cover"
                  />
                </div>
              )}
              <div className="p-4 flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                  <Megaphone className="h-5 w-5 shrink-0" />
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-sm font-bold text-[var(--foreground)] whitespace-pre-wrap break-words">
                    {viewTarget.title}
                  </p>
                  <p className="text-xs text-[var(--gray-500)] whitespace-pre-wrap break-words leading-relaxed">
                    {viewTarget.message}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
