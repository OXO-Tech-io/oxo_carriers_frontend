'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Paperclip, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useManageDocumentsQuery } from '@/hooks/queries/use-documents-query';
import { useCreateDocumentMutation, useDeleteDocumentMutation } from '@/hooks/mutations/use-document-mutations';
import { Modal, Button, DataTable, FileUpload, EmployeeMultiSelect, ConfirmationDialog } from '@/components/ui';
import type { DocumentTargetType, VaultDocument } from '@/types/hrModules';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api(\/v\d+)?\/?$/, '') || 'http://localhost:5000';
const resolveFileUrl = (url: string) => `${API_BASE}${url}`;

const emptyDraft = {
  title: '',
  description: '',
  targetType: 'individual' as DocumentTargetType,
  individualEmployeeIds: [] as number[],
  files: [] as File[],
};

export default function AdminDocumentsPage() {
  const { isHR, isSuperAdmin } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [deleteTarget, setDeleteTarget] = useState<VaultDocument | null>(null);

  const documentsQuery = useManageDocumentsQuery(isHR || isSuperAdmin);
  const createMutation = useCreateDocumentMutation();
  const deleteMutation = useDeleteDocumentMutation();

  if (!isHR && !isSuperAdmin) {
    return <p className="text-sm text-[var(--gray-400)]">You do not have access to this page.</p>;
  }

  const closeModal = () => {
    setShowModal(false);
    setDraft(emptyDraft);
  };

  const canSave =
    draft.title.trim().length > 0 && (draft.targetType === 'all' || draft.individualEmployeeIds.length > 0);

  const handleSave = async () => {
    if (!canSave) return;
    await createMutation.mutateAsync({
      title: draft.title,
      description: draft.description || undefined,
      targetType: draft.targetType,
      individualEmployeeIds: draft.individualEmployeeIds,
      files: draft.files,
    });
    closeModal();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const columns: ColumnDef<VaultDocument, any>[] = [
    { accessorKey: 'title', header: 'Title' },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => (
        <span className="line-clamp-2 max-w-md text-[var(--gray-500)]">{row.original.description || '-'}</span>
      ),
    },
    {
      id: 'target',
      header: 'Target',
      cell: ({ row }) =>
        row.original.targetType === 'all' ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300">
            All Employees
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-slate-950/30 text-gray-700 dark:text-slate-300">
            {(row.original.recipientEmployeeIds?.length ?? 0)} employee(s)
          </span>
        ),
    },
    {
      id: 'attachments',
      header: 'Attachments',
      cell: ({ row }) => {
        const attachments = row.original.attachments ?? [];
        if (attachments.length === 0) return <span className="text-xs text-[var(--gray-400)]">-</span>;
        return (
          <div className="flex flex-col gap-1">
            {attachments.map((a) => (
              <a
                key={a.id}
                href={resolveFileUrl(a.fileUrl)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline"
              >
                <Paperclip className="h-3 w-3" />
                <span className="truncate max-w-[160px]">{a.fileName}</span>
              </a>
            ))}
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
        <button onClick={() => setDeleteTarget(row.original)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Document Vault</h1>
          <p className="text-[var(--gray-400)]">
            Upload documents to specific employees or to everyone. Individually-targeted documents appear only on
            that employee&apos;s profile.
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>Upload Document</Button>
      </div>

      <DataTable columns={columns} data={documentsQuery.data ?? []} isLoading={documentsQuery.isLoading} />

      <Modal isOpen={showModal} onClose={closeModal} title="Upload Document" size="lg">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-[var(--foreground)]">Title</label>
            <input
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              placeholder="e.g. Updated Employment Contract"
              className="mt-1 w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-2.5 text-sm text-[var(--foreground)]"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-[var(--foreground)]">Description (optional)</label>
            <textarea
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              rows={3}
              placeholder="Notes about this document..."
              className="mt-1 w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-2.5 text-sm text-[var(--foreground)]"
            />
          </div>

          <div className="rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-3.5 space-y-3">
            <p className="text-sm font-semibold text-[var(--foreground)]">Target</p>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="targetType"
                  checked={draft.targetType === 'individual'}
                  onChange={() => setDraft({ ...draft, targetType: 'individual' })}
                  className="h-4 w-4 text-[var(--primary)] border-[var(--gray-300)] focus:ring-[var(--primary-ring)]"
                />
                <span className="text-sm text-[var(--foreground)]">Specific employee(s)</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="targetType"
                  checked={draft.targetType === 'all'}
                  onChange={() => setDraft({ ...draft, targetType: 'all', individualEmployeeIds: [] })}
                  className="h-4 w-4 text-[var(--primary)] border-[var(--gray-300)] focus:ring-[var(--primary-ring)]"
                />
                <span className="text-sm text-[var(--foreground)]">All Employees</span>
              </label>
            </div>

            {draft.targetType === 'individual' && (
              <div className="pt-1 animate-fade-in">
                <EmployeeMultiSelect
                  selectedIds={draft.individualEmployeeIds}
                  onChange={(ids) => setDraft({ ...draft, individualEmployeeIds: ids })}
                />
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-semibold text-[var(--foreground)]">Files</label>
            <div className="mt-1">
              <FileUpload multiple maxSizeMB={10} onFilesSelected={(files) => setDraft({ ...draft, files })} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleSave} isLoading={createMutation.isPending} disabled={!canSave}>
              Upload
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmationDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Document"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
