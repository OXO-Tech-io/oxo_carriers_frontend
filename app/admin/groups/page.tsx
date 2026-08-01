'use client';

import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useGroupsQuery, useGroupQuery } from '@/hooks/queries/use-groups-query';
import {
  useCreateGroupMutation,
  useRenameGroupMutation,
  useDeleteGroupMutation,
  useAddGroupMembersMutation,
  useRemoveGroupMemberMutation,
} from '@/hooks/mutations/use-group-mutations';
import { Modal, Button, DataTable, EmployeeMultiSelect, ConfirmationDialog } from '@/components/ui';
import type { Group } from '@/types/hrModules';

export default function AdminGroupsPage() {
  const { isHR, isSuperAdmin } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [manageGroupId, setManageGroupId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Group | null>(null);

  const groupsQuery = useGroupsQuery();
  const createMutation = useCreateGroupMutation();
  const deleteMutation = useDeleteGroupMutation();

  if (!isHR && !isSuperAdmin) {
    return <p className="text-sm text-[var(--gray-400)]">You do not have access to this page.</p>;
  }

  const handleCreate = async () => {
    if (!newGroupName.trim()) return;
    await createMutation.mutateAsync(newGroupName.trim());
    setNewGroupName('');
    setShowCreateModal(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  const columns: ColumnDef<Group, any>[] = [
    { accessorKey: 'name', header: 'Group' },
    { accessorKey: 'memberCount', header: 'Members' },
    { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString() },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setManageGroupId(row.original.id)}
            className="text-sm font-semibold text-[var(--primary)] hover:underline"
          >
            Manage
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
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Groups</h1>
          <p className="text-[var(--gray-400)]">
            Create employee groups (e.g. "HR Group") to use as recipients for communications and forms
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>Create Group</Button>
      </div>

      <DataTable columns={columns} data={groupsQuery.data ?? []} isLoading={groupsQuery.isLoading} />

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Group" size="sm">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-[var(--foreground)]">Name</label>
            <input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="e.g. HR Group"
              className="mt-1 w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-2.5 text-sm text-[var(--foreground)]"
            />
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

      <ManageGroupModal groupId={manageGroupId} onClose={() => setManageGroupId(null)} />

      <ConfirmationDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Group"
        message={`Delete "${deleteTarget?.name}"? This removes the group and its membership list - it cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function ManageGroupModal({ groupId, onClose }: { groupId: number | null; onClose: () => void }) {
  const [nameDraft, setNameDraft] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [newMemberIds, setNewMemberIds] = useState<number[]>([]);

  const groupQuery = useGroupQuery(groupId);
  const renameMutation = useRenameGroupMutation();
  const addMembersMutation = useAddGroupMembersMutation();
  const removeMemberMutation = useRemoveGroupMemberMutation();

  const handleClose = () => {
    setIsEditingName(false);
    setNewMemberIds([]);
    onClose();
  };

  const startEditingName = () => {
    setNameDraft(groupQuery.data?.group.name ?? '');
    setIsEditingName(true);
  };

  const handleRename = async () => {
    if (!groupId || !nameDraft.trim()) return;
    await renameMutation.mutateAsync({ id: groupId, name: nameDraft.trim() });
    setIsEditingName(false);
  };

  const handleAddMembers = async () => {
    if (!groupId || newMemberIds.length === 0) return;
    await addMembersMutation.mutateAsync({ id: groupId, userIds: newMemberIds });
    setNewMemberIds([]);
  };

  const handleRemoveMember = async (userId: number) => {
    if (!groupId) return;
    await removeMemberMutation.mutateAsync({ id: groupId, userId });
  };

  return (
    <Modal isOpen={groupId !== null} onClose={handleClose} title="Manage Group" size="lg">
      {groupQuery.isLoading && <p className="text-sm text-[var(--gray-400)]">Loading...</p>}
      {groupQuery.data && (
        <div className="space-y-6">
          <div>
            <label className="text-sm font-semibold text-[var(--foreground)]">Name</label>
            {isEditingName ? (
              <div className="mt-1 flex items-center gap-2">
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  className="flex-1 rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-2.5 text-sm text-[var(--foreground)]"
                />
                <Button size="sm" onClick={handleRename} isLoading={renameMutation.isPending}>
                  Save
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingName(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-3">
                <p className="text-sm text-[var(--foreground)]">{groupQuery.data.group.name}</p>
                <button onClick={startEditingName} className="text-xs font-semibold text-[var(--primary)] hover:underline">
                  Rename
                </button>
              </div>
            )}
          </div>

          <div>
            <h4 className="text-sm font-bold text-[var(--foreground)] mb-2">
              Members ({groupQuery.data.members.length})
            </h4>
            {groupQuery.data.members.length === 0 && (
              <p className="text-xs text-[var(--gray-400)]">No members yet - add some below.</p>
            )}
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {groupQuery.data.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-[var(--gray-25)]"
                >
                  <span className="text-sm text-[var(--foreground)]">
                    {member.firstName} {member.lastName}
                    <span className="text-[var(--gray-400)]"> · {member.email}</span>
                  </span>
                  <button
                    onClick={() => handleRemoveMember(member.userId)}
                    className="text-xs font-semibold text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-[var(--foreground)] mb-2">Add Members</h4>
            <EmployeeMultiSelect selectedIds={newMemberIds} onChange={setNewMemberIds} maxHeightClassName="max-h-48" />
            <div className="flex justify-end pt-2">
              <Button size="sm" onClick={handleAddMembers} isLoading={addMembersMutation.isPending} disabled={newMemberIds.length === 0}>
                Add Selected
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
