'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/contexts/ToastContext';
import { useFormsQuery, useFormDistributionsQuery } from '@/hooks/queries/use-forms-query';
import {
  useArchiveFormMutation,
  useCreateFormMutation,
  useDeleteFormMutation,
  useDistributeFormMutation,
  useDuplicateFormMutation,
  usePublishFormMutation,
  useUnpublishFormMutation,
} from '@/hooks/mutations/use-form-mutations';
import { Modal, Button, DataTable, RecipientPicker, ConfirmationDialog, ActionsMenu } from '@/components/ui';
import type { ActionsMenuItem } from '@/components/ui';
import type { HrForm } from '@/types/hrModules';

const createFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  closeAt: z.string().optional(),
});
type CreateFormValues = z.infer<typeof createFormSchema>;

const STATUS_STYLES: Record<HrForm['status'], string> = {
  draft: 'bg-[var(--gray-100)] text-[var(--gray-400)]',
  published: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-[var(--warning-light)] text-[var(--warning-text)]',
  archived: 'bg-[var(--gray-100)] text-[var(--gray-400)]',
};

const toDatetimeLocal = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const nowDatetimeLocal = () => toDatetimeLocal(new Date().toISOString());

export default function AdminFormsPage() {
  const { isHR, isSuperAdmin } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDistributeModal, setShowDistributeModal] = useState<HrForm | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<HrForm | null>(null);
  const [recipientIds, setRecipientIds] = useState<number[]>([]);
  const [recipientGroupIds, setRecipientGroupIds] = useState<number[]>([]);
  const [groupMemberIds, setGroupMemberIds] = useState<number[]>([]);

  const [distributeCloseAt, setDistributeCloseAt] = useState('');
  const [deadlineTouched, setDeadlineTouched] = useState(false);
  const [confirmDeadlineChange, setConfirmDeadlineChange] = useState(false);

  const formsQuery = useFormsQuery();
  const distributionsQuery = useFormDistributionsQuery(showDistributeModal?.id ?? null);
  const alreadySentIds = distributionsQuery.data ?? [];
  const createMutation = useCreateFormMutation();
  const publishMutation = usePublishFormMutation();
  const unpublishMutation = useUnpublishFormMutation();
  const archiveMutation = useArchiveFormMutation();
  const duplicateMutation = useDuplicateFormMutation();
  const deleteMutation = useDeleteFormMutation();
  const distributeMutation = useDistributeFormMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateFormValues>({ resolver: zodResolver(createFormSchema) });

  if (!isHR && !isSuperAdmin) {
    return <p className="text-sm text-[var(--gray-400)]">You do not have access to this page.</p>;
  }

  const onCreate = async (values: CreateFormValues) => {
    const created = await createMutation.mutateAsync({
      ...values,
      closeAt: values.closeAt ? new Date(values.closeAt).toISOString() : null,
    });
    reset();
    setShowCreateModal(false);
    router.push(`/admin/forms/${created.id}/edit`);
  };

  const handlePublish = async (id: number) => {
    try {
      await publishMutation.mutateAsync(id);
      toast.success('Form published');
    } catch {
      toast.error('Could not publish form', 'Add at least one question first.');
    }
  };

  const handleUnpublish = async (id: number) => {
    await unpublishMutation.mutateAsync(id);
    toast.success('Form unpublished');
  };

  const handleArchive = async (id: number) => {
    await archiveMutation.mutateAsync(id);
    toast.success('Form archived');
  };

  const handleDuplicate = async (id: number) => {
    const duplicated = await duplicateMutation.mutateAsync(id);
    toast.success('Form duplicated');
    router.push(`/admin/forms/${duplicated.id}/edit`);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deleteMutation.mutateAsync(confirmDelete.id);
    toast.success('Form deleted');
    setConfirmDelete(null);
  };

  const closeDistributeModal = () => {
    setShowDistributeModal(null);
    setRecipientIds([]);
    setRecipientGroupIds([]);
    setGroupMemberIds([]);
    setDistributeCloseAt('');
    setDeadlineTouched(false);
    setConfirmDeadlineChange(false);
  };

  const performDistribute = async () => {
    if (!showDistributeModal) return;
    const resolvedUserIds = [...new Set([...recipientIds, ...groupMemberIds])];
    await distributeMutation.mutateAsync({
      id: showDistributeModal.id,
      userIds: resolvedUserIds,
      groupIds: [],
      // Untouched (deadlineTouched===false) omits closeAt entirely so the form's existing
      // deadline is preserved rather than cleared - see form.validator.ts#distributeFormSchema.
      closeAt: deadlineTouched ? (distributeCloseAt ? new Date(distributeCloseAt).toISOString() : null) : undefined,
    });
    closeDistributeModal();
    toast.success('Form distributed');
  };

  const handleDistribute = () => {
    if (!showDistributeModal || (recipientIds.length === 0 && recipientGroupIds.length === 0)) return;
    // Changing or removing a deadline that's already active for a distributed form is confirmed
    // first - setting a brand-new deadline (there was none before) needs no confirmation.
    if (deadlineTouched && showDistributeModal.closeAt) {
      setConfirmDeadlineChange(true);
      return;
    }
    void performDistribute();
  };

  const columns: ColumnDef<HrForm, any>[] = [
    { accessorKey: 'title', header: 'Title' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[row.original.status]}`}>
          {row.original.status}
        </span>
      ),
    },
    {
      accessorKey: 'closeAt',
      header: 'Deadline',
      cell: ({ row }) =>
        row.original.closeAt ? (
          <span className="text-xs text-[var(--foreground)] flex items-center gap-1 font-medium">
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            {new Date(row.original.closeAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
          </span>
        ) : (
          <span className="text-xs text-[var(--gray-400)]">-</span>
        ),
    },
    {
      accessorKey: 'responseCount',
      header: 'Responses',
      cell: ({ row }) => row.original.responseCount,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const form = row.original;
        const items: ActionsMenuItem[] = [
          { label: 'Edit', onClick: () => router.push(`/admin/forms/${form.id}/edit`) },
          { label: 'Duplicate', onClick: () => handleDuplicate(form.id) },
          ...(form.status === 'draft'
            ? [{ label: 'Publish', onClick: () => handlePublish(form.id) }]
            : []),
          ...(form.status === 'published'
            ? [
                { label: 'Unpublish', onClick: () => handleUnpublish(form.id) },
                {
                  label: 'Distribute',
                  onClick: () => {
                    setShowDistributeModal(form);
                    setDistributeCloseAt(toDatetimeLocal(form.closeAt));
                    setDeadlineTouched(false);
                  },
                },
              ]
            : []),
          ...(form.status !== 'archived'
            ? [{ label: 'Archive', onClick: () => handleArchive(form.id) }]
            : []),
          { label: 'Responses', onClick: () => router.push(`/admin/forms/${form.id}/responses`) },
          { label: 'Analytics', onClick: () => router.push(`/admin/forms/${form.id}/analytics`) },
          { label: 'Settings', onClick: () => router.push(`/admin/forms/${form.id}/settings`) },
          { label: 'Delete', onClick: () => setConfirmDelete(form), variant: 'danger' },
        ];
        return <ActionsMenu items={items} />;
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Forms</h1>
          <p className="text-[var(--gray-400)]">Create data collection forms and distribute them to employees</p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>
          Create Form
        </Button>
      </div>

      <DataTable columns={columns} data={formsQuery.data ?? []} isLoading={formsQuery.isLoading} />

      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          reset();
        }}
        title="Create Form"
      >
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-[var(--foreground)]">Title</label>
            <input
              {...register('title')}
              className="mt-1 w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-2.5 text-sm text-[var(--foreground)]"
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="text-sm font-semibold text-[var(--foreground)]">Description</label>
            <textarea
              {...register('description')}
              rows={2}
              className="mt-1 w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-2.5 text-sm text-[var(--foreground)]"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              Deadline (Optional)
            </label>
            <input
              type="datetime-local"
              min={nowDatetimeLocal()}
              {...register('closeAt')}
              className="mt-1 w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-2.5 text-sm text-[var(--foreground)]"
            />
          </div>
          <p className="text-xs text-[var(--gray-400)]">You&apos;ll add questions and sections next, in the form builder.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowCreateModal(false);
                reset();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Create &amp; continue
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!showDistributeModal} onClose={closeDistributeModal} title={`Distribute — ${showDistributeModal?.title ?? ''}`}>
        <div className="space-y-4">
          <RecipientPicker
            selectedGroupIds={recipientGroupIds}
            onGroupIdsChange={setRecipientGroupIds}
            selectedUserIds={recipientIds}
            onUserIdsChange={setRecipientIds}
            onGroupMemberIdsChange={setGroupMemberIds}
            alreadySentIds={alreadySentIds}
          />
          <div>
            <label className="text-xs font-semibold text-[var(--gray-400)] flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-amber-500" />
              Submission Deadline (Optional)
            </label>
            <input
              type="datetime-local"
              min={nowDatetimeLocal()}
              value={distributeCloseAt}
              onChange={(e) => {
                setDistributeCloseAt(e.target.value);
                setDeadlineTouched(true);
              }}
              className="mt-1 w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-2.5 text-sm text-[var(--foreground)]"
            />
            {showDistributeModal?.closeAt && distributeCloseAt && (
              <button
                type="button"
                onClick={() => {
                  setDistributeCloseAt('');
                  setDeadlineTouched(true);
                }}
                className="mt-1 text-xs font-semibold text-red-500 hover:underline"
              >
                Remove deadline
              </button>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={closeDistributeModal}>
              Cancel
            </Button>
            <Button onClick={handleDistribute} isLoading={distributeMutation.isPending}>
              Distribute
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmationDialog
        isOpen={confirmDeadlineChange}
        onClose={() => setConfirmDeadlineChange(false)}
        onConfirm={() => void performDistribute()}
        title={distributeCloseAt ? 'Update deadline?' : 'Remove deadline?'}
        message={
          distributeCloseAt
            ? 'This changes the submission deadline for this form, including for employees it was already distributed to.'
            : 'This removes the submission deadline for this form. Employees will no longer see a deadline.'
        }
        confirmLabel={distributeCloseAt ? 'Update deadline' : 'Remove deadline'}
        variant="danger"
        isLoading={distributeMutation.isPending}
      />

      <ConfirmationDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        title="Delete form"
        message={`Delete "${confirmDelete?.title ?? ''}"? This also removes its questions and responses. This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
