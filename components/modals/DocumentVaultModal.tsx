'use client';

import { useState } from 'react';
import { Trash2, Paperclip } from 'lucide-react';
import { Modal, Button, FileUpload, ConfirmationDialog, Badge } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useEmployeeDocumentsQuery } from '@/hooks/queries/use-documents-query';
import { useCreateDocumentMutation, useDeleteDocumentMutation } from '@/hooks/mutations/use-document-mutations';
import { DOCUMENT_VAULT_ACCEPT, DOCUMENT_VAULT_ACCEPT_HINT, DOCUMENT_VAULT_TYPE_ERROR } from '@/lib/constants';
import type { VaultDocument } from '@/types/hrModules';

const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api(\/v\d+)?\/?$/, '') || 'http://localhost:5000';
const resolveFileUrl = (url: string) => `${API_BASE}${url}`;

interface DocumentVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: number;
  employeeName: string;
}

// Structural clone of EmployeeNotesModal: an "Add" mini-form plus a
// "History" list, scoped to one employee row on the admin Users page.
export function DocumentVaultModal({ isOpen, onClose, employeeId, employeeName }: DocumentVaultModalProps) {
  const { isHRManager, isSuperAdmin } = useAuth();
  // OCD-496: defense in depth - the Users page already hides the icon that opens
  // this modal for HR Executive, but gate the upload form here too in case the
  // modal is ever reachable through another path.
  const canUpload = isHRManager || isSuperAdmin;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [version, setVersion] = useState('');
  const [isMandatoryViewing, setIsMandatoryViewing] = useState(false);
  // OCD-501: document pending deletion, confirmed via ConfirmationDialog below -
  // the trash icon no longer deletes immediately.
  const [deleteTarget, setDeleteTarget] = useState<VaultDocument | null>(null);

  const documentsQuery = useEmployeeDocumentsQuery(employeeId, { enabled: isOpen });
  const createMutation = useCreateDocumentMutation();
  const deleteMutation = useDeleteDocumentMutation();
  // Only documents targeted at this employee individually - company-wide
  // ('all') documents aren't specific to them and are managed from the
  // Document Vault admin page instead.
  const individualDocuments = ((documentsQuery.data ?? []) as VaultDocument[]).filter(
    (doc) => doc.targetType === 'individual',
  );

  const canSave = canUpload && title.trim().length > 0 && version.trim().length > 0;

  const handleAdd = async () => {
    if (!canSave) return;
    await createMutation.mutateAsync({
      title,
      description: description || undefined,
      targetType: 'individual',
      individualEmployeeIds: [employeeId],
      files,
      version: version.trim(),
      isMandatoryViewing,
    });
    setTitle('');
    setDescription('');
    setFiles([]);
    setVersion('');
    setIsMandatoryViewing(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Document Vault — ${employeeName}`} size="lg">
      <div className="space-y-6">
        {canUpload && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[var(--foreground)]">Upload Document</h4>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title..."
              className="w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-ring)]"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Description (optional)..."
              className="w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-ring)]"
            />
            <input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="Version Number (e.g. 1.0)"
              className="w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-ring)]"
            />
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isMandatoryViewing}
                onChange={(e) => setIsMandatoryViewing(e.target.checked)}
                className="h-4 w-4 rounded text-[var(--primary)] border-[var(--gray-300)] focus:ring-[var(--primary-ring)]"
              />
              <span className="text-sm text-[var(--foreground)]">Mark as mandatory viewing for employees</span>
            </label>
            <div>
              <p className="text-xs text-[var(--gray-400)] mb-1">{DOCUMENT_VAULT_ACCEPT_HINT}</p>
              <FileUpload
                multiple
                maxSizeMB={10}
                accept={DOCUMENT_VAULT_ACCEPT}
                typeErrorMessage={DOCUMENT_VAULT_TYPE_ERROR}
                onFilesSelected={setFiles}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleAdd} isLoading={createMutation.isPending} disabled={!canSave}>
                Upload
              </Button>
            </div>
            <p className="text-xs text-[var(--gray-400)]">
              This document will only be visible on {employeeName}&apos;s Document Vault.
            </p>
          </div>
        )}

        <div className="space-y-3 border-t border-[var(--gray-100)] pt-4">
          <h4 className="text-sm font-bold text-[var(--foreground)]">Document History</h4>
          {documentsQuery.isLoading && <p className="text-xs text-[var(--gray-400)]">Loading documents...</p>}
          {!documentsQuery.isLoading && individualDocuments.length === 0 && (
            <p className="text-xs text-[var(--gray-400)]">No documents yet.</p>
          )}
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {individualDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-start justify-between gap-3 p-3 rounded-xl bg-[var(--gray-25)] border border-[var(--gray-100)]"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-xs font-bold text-[var(--foreground)]">{doc.title}</p>
                    {doc.version && <Badge variant="gray">v{doc.version}</Badge>}
                    {doc.isMandatoryViewing && <Badge variant="warning">Mandatory</Badge>}
                  </div>
                  {doc.description && <p className="text-xs text-[var(--gray-400)] mt-0.5">{doc.description}</p>}
                  {(doc.attachments?.length ?? 0) > 0 && (
                    <div className="flex flex-col gap-1 mt-1.5">
                      {doc.attachments!.map((a) => (
                        <a
                          key={a.id}
                          href={resolveFileUrl(a.fileUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs font-semibold text-[var(--primary-hover)] hover:underline"
                        >
                          <Paperclip className="h-3 w-3" />
                          <span className="truncate max-w-[220px]">{a.fileName}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setDeleteTarget(doc)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg shrink-0"
                  title="Delete document"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmationDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Document"
        message="Are you sure you want to delete this document? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </Modal>
  );
}
