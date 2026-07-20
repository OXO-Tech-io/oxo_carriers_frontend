'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useFormsQuery } from '@/hooks/queries/use-forms-query';
import { useCreateFormMutation, useDistributeFormMutation, usePublishFormMutation } from '@/hooks/mutations/use-form-mutations';
import { Modal, Button, DataTable, EmployeeMultiSelect } from '@/components/ui';
import type { FormFieldDraft, FormFieldType, HrForm } from '@/types/hrModules';

const FIELD_TYPE_OPTIONS: { value: FormFieldType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'radio', label: 'Option Buttons' },
  { value: 'select', label: 'List Box' },
  { value: 'file', label: 'File Upload' },
];

const emptyField = (orderIndex: number): FormFieldDraft => ({
  label: '',
  fieldType: 'text',
  options: [],
  required: false,
  orderIndex,
});

export default function AdminFormsPage() {
  const { isHR, isSuperAdmin } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDistributeModal, setShowDistributeModal] = useState<HrForm | null>(null);
  const [recipientIds, setRecipientIds] = useState<number[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<FormFieldDraft[]>([emptyField(0)]);

  const formsQuery = useFormsQuery();
  const createMutation = useCreateFormMutation();
  const publishMutation = usePublishFormMutation();
  const distributeMutation = useDistributeFormMutation();

  if (!isHR && !isSuperAdmin) {
    return <p className="text-sm text-[var(--gray-400)]">You do not have access to this page.</p>;
  }

  const updateField = (index: number, patch: Partial<FormFieldDraft>) => {
    setFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  };

  const addField = () => setFields((prev) => [...prev, emptyField(prev.length)]);
  const removeField = (index: number) => setFields((prev) => prev.filter((_, i) => i !== index));

  const handleCreate = async () => {
    if (!title.trim() || fields.some((f) => !f.label.trim())) return;
    await createMutation.mutateAsync({ title, description, fields });
    setTitle('');
    setDescription('');
    setFields([emptyField(0)]);
    setShowCreateModal(false);
  };

  const handlePublish = async (id: number) => {
    await publishMutation.mutateAsync(id);
  };

  const handleDistribute = async () => {
    if (!showDistributeModal || recipientIds.length === 0) return;
    await distributeMutation.mutateAsync({ id: showDistributeModal.id, userIds: recipientIds });
    setShowDistributeModal(null);
    setRecipientIds([]);
  };

  const columns: ColumnDef<HrForm, any>[] = [
    { accessorKey: 'title', header: 'Title' },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.original.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-[var(--gray-100)] text-[var(--gray-400)]'
          }`}
        >
          {row.original.status}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          {row.original.status === 'draft' && (
            <button
              onClick={() => handlePublish(row.original.id)}
              className="text-sm font-semibold text-[var(--primary)] hover:underline"
            >
              Publish
            </button>
          )}
          {row.original.status === 'published' && (
            <button
              onClick={() => setShowDistributeModal(row.original)}
              className="text-sm font-semibold text-[var(--primary)] hover:underline"
            >
              Distribute
            </button>
          )}
          <Link href={`/admin/forms/${row.original.id}/responses`} className="text-sm font-semibold text-[var(--primary)] hover:underline">
            Responses
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Forms</h1>
          <p className="text-[var(--gray-400)]">Create data collection forms and distribute them to employees</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>Create Form</Button>
      </div>

      <DataTable columns={columns} data={formsQuery.data ?? []} isLoading={formsQuery.isLoading} />

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Form" size="xl">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-[var(--foreground)]">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-2.5 text-sm text-[var(--foreground)]"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-[var(--foreground)]">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-2.5 text-sm text-[var(--foreground)]"
            />
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[var(--foreground)]">Fields</h4>
            {fields.map((field, index) => (
              <div key={index} className="rounded-xl border border-[var(--gray-100)] p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    value={field.label}
                    onChange={(e) => updateField(index, { label: e.target.value })}
                    placeholder="Field label"
                    className="flex-1 rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-2 text-sm text-[var(--foreground)]"
                  />
                  <select
                    value={field.fieldType}
                    onChange={(e) => updateField(index, { fieldType: e.target.value as FormFieldType })}
                    className="rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-2 text-sm text-[var(--foreground)]"
                  >
                    {FIELD_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-[var(--gray-400)]">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) => updateField(index, { required: e.target.checked })}
                    />
                    Required
                  </label>
                  {fields.length > 1 && (
                    <button type="button" onClick={() => removeField(index)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {(field.fieldType === 'radio' || field.fieldType === 'select') && (
                  <input
                    value={(field.options ?? []).join(', ')}
                    onChange={(e) => updateField(index, { options: e.target.value.split(',').map((o) => o.trim()).filter(Boolean) })}
                    placeholder="Options, comma-separated"
                    className="w-full rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-2 text-sm text-[var(--foreground)]"
                  />
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" leftIcon={<Plus className="h-4 w-4" />} onClick={addField}>
              Add field
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} isLoading={createMutation.isPending}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!showDistributeModal} onClose={() => setShowDistributeModal(null)} title={`Distribute — ${showDistributeModal?.title ?? ''}`}>
        <div className="space-y-4">
          <EmployeeMultiSelect selectedIds={recipientIds} onChange={setRecipientIds} />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowDistributeModal(null)}>
              Cancel
            </Button>
            <Button onClick={handleDistribute} isLoading={distributeMutation.isPending}>
              Distribute
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
