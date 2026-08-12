'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useManageNoticesQuery } from '@/hooks/queries/use-notices-query';
import {
  useCreateNoticeMutation,
  useUpdateNoticeMutation,
  useDeleteNoticeMutation,
} from '@/hooks/mutations/use-notice-mutations';
import { Modal, Button, DataTable, ConfirmationDialog } from '@/components/ui';
import type { Notice } from '@/types/hrModules';

const emptyDraft = { title: '', message: '', isActive: true };

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
    setDraft({ title: notice.title, message: notice.message, isActive: notice.isActive });
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
