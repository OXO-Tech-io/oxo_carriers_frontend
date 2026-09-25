'use client';

import { useState } from 'react';
import { Button, Modal } from '@/components/ui';
import { useUpdateWorkLogMutation } from '@/hooks/mutations/use-work-log-mutations';
import type { WorkLog, WorkLogEntryDraft } from '@/types/hrModules';
import { blockInvalidMinutesKeys, clampMinutes, isFutureDate, isValidMinutes, todayIso } from '@/lib/work-log-validation';

interface WorkLogEditModalProps {
  entry: WorkLog | null;
  onClose: () => void;
}

const draftFromEntry = (entry: WorkLog | null): WorkLogEntryDraft =>
  entry
    ? {
        workDate: entry.workDate.slice(0, 10),
        taskDescription: entry.taskDescription,
        minutesSpent: entry.minutesSpent,
        remarks: entry.remarks ?? '',
      }
    : { workDate: '', taskDescription: '', minutesSpent: 0, remarks: '' };

/** Lets an employee correct a submitted entry - see OCD-464. HR sees the
 *  result flagged via WorkLog.isEdited (rendered as an "Edited" badge).
 *  The caller mounts this with `key={entry?.id}` so a new entry gets a fresh
 *  draft without needing an effect to re-sync state from props. */
export function WorkLogEditModal({ entry, onClose }: WorkLogEditModalProps) {
  const [draft, setDraft] = useState<WorkLogEntryDraft>(() => draftFromEntry(entry));
  const updateMutation = useUpdateWorkLogMutation();

  const isValid =
    draft.taskDescription.trim().length > 0 && isValidMinutes(draft.minutesSpent) && !isFutureDate(draft.workDate);

  const handleSave = async () => {
    if (!entry || !isValid) return;
    await updateMutation.mutateAsync({ id: entry.id, entry: draft });
    onClose();
  };

  return (
    <Modal isOpen={!!entry} onClose={onClose} title="Edit Work Log Entry" size="md">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-[var(--gray-400)]">Date</label>
          <input
            type="date"
            value={draft.workDate}
            max={todayIso()}
            onChange={(e) => setDraft((d) => ({ ...d, workDate: e.target.value }))}
            className="mt-1 block w-full rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-2 text-sm text-[var(--foreground)]"
          />
          {isFutureDate(draft.workDate) && (
            <p className="mt-1 text-xs text-red-500">Worklogs cannot be submitted for future dates.</p>
          )}
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--gray-400)]">Task Description</label>
          <input
            value={draft.taskDescription}
            onChange={(e) => setDraft((d) => ({ ...d, taskDescription: e.target.value }))}
            className="mt-1 block w-full rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-2 text-sm text-[var(--foreground)]"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--gray-400)]">Minutes</label>
          <input
            type="number"
            min={1}
            max={1440}
            step={1}
            inputMode="numeric"
            value={draft.minutesSpent}
            onKeyDown={blockInvalidMinutesKeys}
            onChange={(e) => setDraft((d) => ({ ...d, minutesSpent: clampMinutes(Number(e.target.value)) }))}
            className="mt-1 w-32 rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-2 text-sm text-[var(--foreground)]"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-[var(--gray-400)]">Remarks</label>
          <input
            value={draft.remarks ?? ''}
            onChange={(e) => setDraft((d) => ({ ...d, remarks: e.target.value }))}
            className="mt-1 block w-full rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-2 text-sm text-[var(--foreground)]"
          />
        </div>
        {updateMutation.isError && (
          <p className="text-xs font-semibold text-red-600">
            Could not save this entry. Check the total minutes for this date does not exceed 1440 (24 hours).
          </p>
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} isLoading={updateMutation.isPending} disabled={!isValid}>
            Save changes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
