'use client';

import { useEffect, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { ImageOff, Trash2, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useManageNoticesQuery } from '@/hooks/queries/use-notices-query';
import {
  useCreateNoticeMutation,
  useUpdateNoticeMutation,
  useDeleteNoticeMutation,
} from '@/hooks/mutations/use-notice-mutations';
import { Modal, Button, DataTable, ConfirmationDialog } from '@/components/ui';
import { FileUpload } from '@/components/ui/FileUpload';
import { resolveFileUrl as resolveImageUrl } from '@/lib/constants';
import type { Notice } from '@/types/hrModules';

const emptyDraft = {
  title: '',
  message: '',
  isActive: true,
  image: null as File | null,
  removeImage: false,
};

export default function AdminNoticesPage() {
  const { isHR, isSuperAdmin } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [deleteTarget, setDeleteTarget] = useState<Notice | null>(null);

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
    setDraft(emptyDraft);
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
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingNotice(null);
    setDraft(emptyDraft);
  };

  const handleSave = async () => {
    if (!draft.title.trim() || !draft.message.trim()) return;
    if (editingNotice) {
      await updateMutation.mutateAsync({ id: editingNotice.id, input: draft });
    } else {
      await createMutation.mutateAsync(draft);
    }
    closeModal();
  };

  const handleImageSelected = (files: File[]) => {
    setDraft((prev) => ({ ...prev, image: files[0] ?? null, removeImage: false }));
  };

  const handleRemoveImage = () => {
    setDraft((prev) => (prev.image ? { ...prev, image: null } : { ...prev, removeImage: true }));
  };

  const handleToggleActive = async (notice: Notice) => {
    await updateMutation.mutateAsync({ id: notice.id, input: { isActive: !notice.isActive } });
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
    { accessorKey: 'title', header: 'Title' },
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
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            row.original.isActive
              ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
              : 'bg-gray-100 dark:bg-slate-950/30 text-gray-700 dark:text-slate-300'
          }`}
        >
          {row.original.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
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
            onClick={() => openEdit(row.original)}
            className="text-sm font-semibold text-[var(--primary)] hover:underline"
          >
            Edit
          </button>
          <button
            onClick={() => handleToggleActive(row.original)}
            className="text-sm font-semibold text-[var(--gray-500)] hover:underline"
          >
            {row.original.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button onClick={() => setDeleteTarget(row.original)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
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
              className="mt-1 w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-2.5 text-sm text-[var(--foreground)]"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-[var(--foreground)]">Message</label>
            <textarea
              value={draft.message}
              onChange={(e) => setDraft({ ...draft, message: e.target.value })}
              rows={4}
              placeholder="Notice details..."
              className="mt-1 w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-2.5 text-sm text-[var(--foreground)]"
            />
          </div>
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
              <FileUpload accept="image/*" maxSizeMB={5} onFilesSelected={handleImageSelected} />
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
            <Button
              onClick={handleSave}
              isLoading={isSaving}
              disabled={!draft.title.trim() || !draft.message.trim()}
            >
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
    </div>
  );
}
