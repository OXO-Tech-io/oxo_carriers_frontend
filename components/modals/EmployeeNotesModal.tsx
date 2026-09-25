'use client';

import { useState } from 'react';
import { Modal, Button, FileUpload } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useEmployeeNotesQuery } from '@/hooks/queries/use-employee-notes-query';
import { useCreateEmployeeNoteMutation, useUpdateEmployeeNoteMutation } from '@/hooks/mutations/use-employee-note-mutations';
import type { EmployeeNote } from '@/types/hrModules';

interface EmployeeNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: number;
  employeeName: string;
}

// HR Team (hr_executive) only ever sees the "Add Note" form - no list is
// rendered for that role, matching the doc's write-only requirement. Only
// HR Manager/super_admin sees the full note history with author + timestamp
// and can edit entries.
// OCD-480: notes are historical/audit records - only the note's own author,
// or someone holding a strictly more senior role than the author, may edit
// it (also enforced server-side - this only controls whether the Edit
// button is shown). Mirrors the HR_MANAGER > HR_EXECUTIVE authority already
// established for Profile Approvals (OCD-473).
const NOTE_ROLE_RANK: Record<string, number> = {
  hr_executive: 1,
  hr_manager: 2,
  super_admin: 3,
};

export function EmployeeNotesModal({ isOpen, onClose, employeeId, employeeName }: EmployeeNotesModalProps) {
  const { user, isHRManager, isSuperAdmin } = useAuth();
  const canViewNotes = isHRManager || isSuperAdmin;

  const [content, setContent] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  const notesQuery = useEmployeeNotesQuery(employeeId, { enabled: isOpen && canViewNotes });
  const createMutation = useCreateEmployeeNoteMutation(employeeId);
  const updateMutation = useUpdateEmployeeNoteMutation(employeeId);

  const handleAdd = async () => {
    if (!content.trim()) return;
    await createMutation.mutateAsync({ content, files });
    setContent('');
    setFiles([]);
  };

  const startEdit = (note: EmployeeNote) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  // OCD-480: super_admin outranks everyone; otherwise you can edit your own
  // note, or a note authored by a strictly lower-ranked role. Notes with no
  // resolvable author role are treated as rank 0 (editable by any of the
  // three note-privileged roles).
  const canEditNote = (note: EmployeeNote) => {
    if (isSuperAdmin) return true;
    if (user?.id != null && note.authorUserId === user.id) return true;
    const actorRank = NOTE_ROLE_RANK[user?.role ?? ''] ?? 0;
    const authorRank = note.authorRole ? NOTE_ROLE_RANK[note.authorRole] ?? 0 : 0;
    return actorRank > authorRank;
  };

  const saveEdit = async () => {
    if (editingId === null) return;
    await updateMutation.mutateAsync({ id: editingId, content: editContent });
    setEditingId(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Notes — ${employeeName}`} size="lg">
      <div className="space-y-6">
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-[var(--foreground)]">Add a Note</h4>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            placeholder="Write a note about this employee..."
            className="w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-ring)]"
          />
          <FileUpload multiple maxSizeMB={10} onFilesSelected={setFiles} />
          <div className="flex justify-end">
            <Button onClick={handleAdd} isLoading={createMutation.isPending} disabled={!content.trim()}>
              Add Note
            </Button>
          </div>
          {!canViewNotes && (
            <p className="text-xs text-[var(--gray-400)]">
              Notes you add here cannot be viewed or edited by you afterwards — only HR Manager can review note history.
            </p>
          )}
        </div>

        {canViewNotes && (
          <div className="space-y-3 border-t border-[var(--gray-100)] pt-4">
            <h4 className="text-sm font-bold text-[var(--foreground)]">Note History</h4>
            {notesQuery.isLoading && <p className="text-xs text-[var(--gray-400)]">Loading notes...</p>}
            {notesQuery.data?.length === 0 && <p className="text-xs text-[var(--gray-400)]">No notes yet.</p>}
            <ul className="space-y-3">
              {notesQuery.data?.map((note) => (
                <li key={note.id} className="rounded-xl border border-[var(--gray-100)] bg-[var(--gray-25)] p-3">
                  {editingId === note.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-[var(--gray-200)] bg-[var(--card-bg)] p-2 text-sm text-[var(--foreground)]"
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                        <Button size="sm" onClick={saveEdit} isLoading={updateMutation.isPending}>
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-[var(--foreground)] whitespace-pre-wrap">{note.content}</p>
                      {note.attachments && note.attachments.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {note.attachments.map((a) => (
                            <li key={a.id}>
                              <a
                                href={`${process.env.NEXT_PUBLIC_API_URL?.replace(/\/api(\/v\d+)?\/?$/, '') ?? ''}${a.fileUrl}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-semibold text-[var(--primary)]"
                              >
                                {a.fileName}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <p className="text-[10px] text-[var(--gray-400)]">
                          {new Date(note.createdAt).toLocaleString()}
                          {note.authorName && (
                            <span className="font-semibold text-[var(--gray-500)]"> · Added by {note.authorName}</span>
                          )}
                        </p>
                        {canEditNote(note) && (
                          <button
                            type="button"
                            onClick={() => startEdit(note)}
                            className="text-xs font-semibold text-[var(--primary)] hover:underline"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
}
