'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Paperclip, Trash2 } from 'lucide-react';
import { useMyPermissionLevel } from '@/hooks/useMyPermissionLevel';
import { useManageDocumentsQuery } from '@/hooks/queries/use-documents-query';
import { useCreateDocumentMutation, useDeleteDocumentMutation } from '@/hooks/mutations/use-document-mutations';
import { Modal, Button, DataTable, FileUpload, EmployeeMultiSelect, ConfirmationDialog, Badge } from '@/components/ui';
import { resolveFileUrl, DOCUMENT_VAULT_ACCEPT, DOCUMENT_VAULT_ACCEPT_HINT, DOCUMENT_VAULT_TYPE_ERROR } from '@/lib/constants';
import type { DocumentTargetType, VaultDocument } from '@/types/hrModules';

const emptyDraft = {
  title: '',
  description: '',
  targetType: 'individual' as DocumentTargetType,
  individualEmployeeIds: [] as number[],
  files: [] as File[],
  version: '',
  isMandatoryViewing: false,
};

const PAGE_SIZE = 10;

export default function AdminDocumentsPage() {
  // Everything on this page (listing, uploading, deleting) is document_vault
  // 'write' on the backend, which is Super Admin only by default - HR Manager
  // and HR Executive only get 'read' - so access follows that permission
  // rather than a hard-coded role.
  const { allowed: canManage, loaded: permissionLoaded } = useMyPermissionLevel('document_vault', 'write');
  const [showModal, setShowModal] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [deleteTarget, setDeleteTarget] = useState<VaultDocument | null>(null);
  const [pageIndex, setPageIndex] = useState(0);

  const documentsQuery = useManageDocumentsQuery({ page: pageIndex + 1, pageSize: PAGE_SIZE }, canManage);
  const createMutation = useCreateDocumentMutation();
  const deleteMutation = useDeleteDocumentMutation();

  if (!permissionLoaded) return null;
  if (!canManage) {
    return <p className="text-sm text-[var(--gray-400)]">You do not have access to this page.</p>;
  }

  const closeModal = () => {
    setShowModal(false);
    setDraft(emptyDraft);
  };

  const canSave =
    draft.title.trim().length > 0 &&
    draft.version.trim().length > 0 &&
    (draft.targetType === 'all' || draft.individualEmployeeIds.length > 0);

  const handleSave = async () => {
    if (!canSave) return;
    await createMutation.mutateAsync({
      title: draft.title,
      description: draft.description || undefined,
      targetType: draft.targetType,
      individualEmployeeIds: draft.individualEmployeeIds,
      files: draft.files,
      version: draft.version.trim(),
      isMandatoryViewing: draft.isMandatoryViewing,
    });
    closeModal();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const columns: ColumnDef<VaultDocument, any>[] = [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-[var(--foreground)]">{row.original.title}</span>
          {row.original.version && <Badge variant="gray">v{row.original.version}</Badge>}
          {row.original.isMandatoryViewing && <Badge variant="warning">Mandatory</Badge>}
        </div>
      ),
    },
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
      // OCD-497: use the shared Badge component (light/dark-safe --info-*/--purple-*
      // tokens) instead of hand-rolled bg-blue-100/text-blue-700 spans, which fell
      // short of AA contrast in light mode.
      cell: ({ row }) =>
        row.original.targetType === 'all' ? (
          <Badge variant="info" className="uppercase tracking-wider">
            All Employees
          </Badge>
        ) : (
          <Badge variant="purple" className="uppercase tracking-wider">
            {(row.original.recipientEmployeeIds?.length ?? 0)} employee(s)
          </Badge>
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
                // OCD-497: --primary alone is under AA contrast on the light-mode
                // card background; --primary-hover is the darker end of the same
                // accent family and passes AA (~5.5:1 on white).
                className="flex items-center gap-1 text-xs font-semibold text-[var(--primary-hover)] hover:underline"
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

      <DataTable
        columns={columns}
        data={documentsQuery.data?.items ?? []}
        isLoading={documentsQuery.isLoading}
        pageSize={PAGE_SIZE}
        manualPagination
        pageCount={Math.max(1, Math.ceil((documentsQuery.data?.total ?? 0) / PAGE_SIZE))}
        pageIndex={pageIndex}
        onPageChange={setPageIndex}
      />

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

          <div>
            <label className="text-sm font-semibold text-[var(--foreground)]">Version Number</label>
            <input
              value={draft.version}
              onChange={(e) => setDraft({ ...draft, version: e.target.value })}
              placeholder="e.g. 1.0"
              className="mt-1 w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-2.5 text-sm text-[var(--foreground)]"
            />
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={draft.isMandatoryViewing}
              onChange={(e) => setDraft({ ...draft, isMandatoryViewing: e.target.checked })}
              className="h-4 w-4 rounded text-[var(--primary)] border-[var(--gray-300)] focus:ring-[var(--primary-ring)]"
            />
            <span className="text-sm text-[var(--foreground)]">Mark as mandatory viewing for employees</span>
          </label>

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
            <p className="mt-0.5 text-xs text-[var(--gray-400)]">{DOCUMENT_VAULT_ACCEPT_HINT}</p>
            <div className="mt-1">
              <FileUpload
                multiple
                maxSizeMB={10}
                accept={DOCUMENT_VAULT_ACCEPT}
                typeErrorMessage={DOCUMENT_VAULT_TYPE_ERROR}
                onFilesSelected={(files) => setDraft({ ...draft, files })}
              />
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
