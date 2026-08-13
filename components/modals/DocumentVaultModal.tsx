'use client';

import { useState } from 'react';
import { Trash2, Paperclip } from 'lucide-react';
import { Modal, Button, FileUpload } from '@/components/ui';
import { useEmployeeDocumentsQuery } from '@/hooks/queries/use-documents-query';
import { useCreateDocumentMutation, useDeleteDocumentMutation } from '@/hooks/mutations/use-document-mutations';

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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<File[]>([]);

  const documentsQuery = useEmployeeDocumentsQuery(employeeId, { enabled: isOpen });
  const createMutation = useCreateDocumentMutation();
  const deleteMutation = useDeleteDocumentMutation();
  // Only documents targeted at this employee individually - company-wide
  // ('all') documents aren't specific to them and are managed from the
  // Document Vault admin page instead.
  const individualDocuments = (documentsQuery.data ?? []).filter((doc) => doc.targetType === 'individual');

  const handleAdd = async () => {
    if (!title.trim()) return;
    await createMutation.mutateAsync({
      title,
      description: description || undefined,
      targetType: 'individual',
      individualEmployeeIds: [employeeId],
      files,
    });
    setTitle('');
    setDescription('');
    setFiles([]);
  };

  const handleDelete = async (id: number) => {
    await deleteMutation.mutateAsync(id);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Document Vault — ${employeeName}`} size="lg">
      <div className="space-y-6">
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
          <FileUpload multiple maxSizeMB={10} onFilesSelected={setFiles} />
          <div className="flex justify-end">
            <Button onClick={handleAdd} isLoading={createMutation.isPending} disabled={!title.trim()}>
              Upload
            </Button>
          </div>
          <p className="text-xs text-[var(--gray-400)]">
            This document will only be visible on {employeeName}&apos;s Document Vault.
          </p>
        </div>

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
                  <p className="text-xs font-bold text-[var(--foreground)]">{doc.title}</p>
                  {doc.description && <p className="text-xs text-[var(--gray-400)] mt-0.5">{doc.description}</p>}
                  {(doc.attachments?.length ?? 0) > 0 && (
                    <div className="flex flex-col gap-1 mt-1.5">
                      {doc.attachments!.map((a) => (
                        <a
                          key={a.id}
                          href={resolveFileUrl(a.fileUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline"
                        >
                          <Paperclip className="h-3 w-3" />
                          <span className="truncate max-w-[220px]">{a.fileName}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
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
    </Modal>
  );
}
