'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Download } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCommunicationsQuery } from '@/hooks/queries/use-communications-query';
import { useCreateCommunicationMutation } from '@/hooks/mutations/use-communication-mutations';
import { communicationService } from '@/lib/services/communication.service';
import { Modal, Button, DataTable, FileUpload, EmployeeMultiSelect } from '@/components/ui';
import type { Communication } from '@/types/hrModules';

export default function AdminCommunicationsPage() {
  const { isHR, isHRManager, isSuperAdmin } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [recipientIds, setRecipientIds] = useState<number[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const communicationsQuery = useCommunicationsQuery();
  const createMutation = useCreateCommunicationMutation();

  if (!isHR && !isSuperAdmin) {
    return <p className="text-sm text-[var(--gray-400)]">You do not have access to this page.</p>;
  }

  const handleCreate = async () => {
    if (!title.trim() || !body.trim() || recipientIds.length === 0) return;
    await createMutation.mutateAsync({ title, body, recipientUserIds: recipientIds, files });
    setTitle('');
    setBody('');
    setRecipientIds([]);
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
    { accessorKey: 'createdAt', header: 'Sent', cell: ({ row }) => new Date(row.original.createdAt).toLocaleString() },
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

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="New Communication" size="lg">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-[var(--foreground)]">Subject</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-2.5 text-sm text-[var(--foreground)]"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-[var(--foreground)]">Message</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="mt-1 w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-2.5 text-sm text-[var(--foreground)]"
            />
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
              <EmployeeMultiSelect selectedIds={recipientIds} onChange={setRecipientIds} />
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
    </div>
  );
}
