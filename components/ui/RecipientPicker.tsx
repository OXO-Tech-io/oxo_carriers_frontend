'use client';

import { useEffect, useMemo, useState } from 'react';
import { useGroupsQuery, useGroupQuery } from '@/hooks/queries/use-groups-query';
import { EmployeeMultiSelect } from './EmployeeMultiSelect';

interface RecipientPickerProps {
  selectedGroupIds: number[];
  onGroupIdsChange: (ids: number[]) => void;
  selectedUserIds: number[];
  onUserIdsChange: (ids: number[]) => void;
  onGroupMemberIdsChange: (ids: number[]) => void;
  /** Employees who already have this send/form - shown but disabled instead of selectable again. */
  alreadySentIds?: number[];
}

// Lets a sender pick groups and/or individual employees for the same
// Communication/Form send. Checking a group expands its member list so
// specific members can be unchecked before sending. The backend has no
// concept of a partial group send, so the caller must flatten the resolved
// member ids (reported via onGroupMemberIdsChange) into its explicit
// user-id list instead of forwarding the group id as-is once any member
// has been unchecked.
export function RecipientPicker({
  selectedGroupIds,
  onGroupIdsChange,
  selectedUserIds,
  onUserIdsChange,
  onGroupMemberIdsChange,
  alreadySentIds = [],
}: RecipientPickerProps) {
  const groupsQuery = useGroupsQuery();
  const groups = groupsQuery.data ?? [];

  const [resolvedByGroup, setResolvedByGroup] = useState<Record<number, number[]>>({});

  const toggleGroup = (id: number) => {
    if (selectedGroupIds.includes(id)) {
      onGroupIdsChange(selectedGroupIds.filter((existing) => existing !== id));
      setResolvedByGroup((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      onGroupIdsChange([...selectedGroupIds, id]);
    }
  };

  // Keyed by VALUE (not the array's own identity, which callers routinely pass as a fresh literal
  // every render - e.g. `data ?? []`) so this Set - and everything downstream that depends on it -
  // only changes identity when the actual id list changes. Without this, a child effect keyed off
  // alreadySentSet would re-fire every render, call back up into this component's own state, and
  // loop forever.
  const alreadySentKey = [...alreadySentIds].sort((a, b) => a - b).join(',');
  const alreadySentSet = useMemo(() => new Set(alreadySentIds), [alreadySentKey]);

  useEffect(() => {
    const union = new Set<number>();
    for (const ids of Object.values(resolvedByGroup)) {
      ids.forEach((id) => {
        if (!alreadySentSet.has(id)) union.add(id);
      });
    }
    onGroupMemberIdsChange([...union]);
    // onGroupMemberIdsChange intentionally excluded - callers pass an inline setter
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resolvedByGroup, alreadySentSet]);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">Groups</p>
        <div className="space-y-1 max-h-64 overflow-y-auto rounded-xl border border-[var(--gray-100)] p-2">
          {groupsQuery.isLoading && <p className="text-xs text-[var(--gray-400)] px-2 py-1">Loading...</p>}
          {!groupsQuery.isLoading && groups.length === 0 && (
            <p className="text-xs text-[var(--gray-400)] px-2 py-1">No groups yet</p>
          )}
          {groups.map((group) => (
            <div key={group.id}>
              <label className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[var(--gray-25)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedGroupIds.includes(group.id)}
                  onChange={() => toggleGroup(group.id)}
                  className="h-4 w-4 rounded border-[var(--gray-300)] text-[var(--primary)] focus:ring-[var(--primary-ring)]"
                />
                <span className="text-sm text-[var(--foreground)]">
                  {group.name}
                  <span className="text-[var(--gray-400)]"> · {group.memberCount} member(s)</span>
                </span>
              </label>
              {selectedGroupIds.includes(group.id) && (
                <GroupMembersChecklist
                  groupId={group.id}
                  alreadySentIds={alreadySentSet}
                  onResolvedChange={(ids) => setResolvedByGroup((prev) => ({ ...prev, [group.id]: ids }))}
                />
              )}
            </div>
          ))}
        </div>
        {selectedGroupIds.length > 0 && (
          <p className="text-xs font-medium text-[var(--primary)] mt-1">{selectedGroupIds.length} group(s) selected</p>
        )}
      </div>

      <div>
        <p className="text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider mb-2">Individuals</p>
        <EmployeeMultiSelect
          selectedIds={selectedUserIds}
          onChange={onUserIdsChange}
          maxHeightClassName="max-h-40"
          disabledIds={alreadySentIds}
        />
      </div>
    </div>
  );
}

function GroupMembersChecklist({
  groupId,
  alreadySentIds,
  onResolvedChange,
}: {
  groupId: number;
  alreadySentIds: Set<number>;
  onResolvedChange: (userIds: number[]) => void;
}) {
  const groupQuery = useGroupQuery(groupId);
  const members = groupQuery.data?.members ?? [];
  const [excludedIds, setExcludedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    onResolvedChange(
      members.filter((member) => !excludedIds.has(member.userId) && !alreadySentIds.has(member.userId)).map((member) => member.userId),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, excludedIds, alreadySentIds]);

  const toggleMember = (userId: number) => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  return (
    <div className="ml-6 my-1 pl-3 border-l-2 border-[var(--gray-100)] space-y-0.5">
      {groupQuery.isLoading && <p className="text-xs text-[var(--gray-400)] px-2 py-1">Loading members...</p>}
      {!groupQuery.isLoading && members.length === 0 && (
        <p className="text-xs text-[var(--gray-400)] px-2 py-1">No members in this group</p>
      )}
      {members.map((member) => {
        const alreadySent = alreadySentIds.has(member.userId);
        return (
          <label
            key={member.id}
            className={`flex items-center gap-2 px-2 py-1 rounded-lg ${
              alreadySent ? 'cursor-not-allowed opacity-50' : 'hover:bg-[var(--gray-25)] cursor-pointer'
            }`}
          >
            <input
              type="checkbox"
              checked={!excludedIds.has(member.userId) && !alreadySent}
              disabled={alreadySent}
              onChange={() => toggleMember(member.userId)}
              className="h-3.5 w-3.5 rounded border-[var(--gray-300)] text-[var(--primary)] focus:ring-[var(--primary-ring)]"
            />
            <span className="text-xs text-[var(--foreground)]">
              {member.firstName} {member.lastName}
              <span className="text-[var(--gray-400)]"> · {member.email}</span>
              {alreadySent && <span className="ml-1.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">Already sent</span>}
            </span>
          </label>
        );
      })}
    </div>
  );
}
