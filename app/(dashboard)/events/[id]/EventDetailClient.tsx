'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useEventQuery } from '@/hooks/queries/use-events-query';
import { useRecordParticipationMutation } from '@/hooks/mutations/use-event-mutations';
import { userDirectoryService } from '@/lib/services/user-directory.service';
import { Button } from '@/components/ui';
import type { EmployeeSummary } from '@/types/hrModules';

export default function EventDetailClient() {
  const params = useParams<{ id: string }>();
  const eventId = Number(params.id);
  const { isHR, isSuperAdmin } = useAuth();

  const eventQuery = useEventQuery(eventId);
  const recordMutation = useRecordParticipationMutation(eventId);

  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [willParticipate, setWillParticipate] = useState<Record<number, boolean | null>>({});

  useEffect(() => {
    userDirectoryService.list().then(setEmployees);
  }, []);

  useEffect(() => {
    if (!eventQuery.data) return;
    const map: Record<number, boolean> = {};
    const intentMap: Record<number, boolean | null> = {};
    eventQuery.data.participants.forEach((p) => {
      map[p.userId] = p.participated;
      intentMap[p.userId] = p.willParticipate;
    });
    setChecked(map);
    setWillParticipate(intentMap);
  }, [eventQuery.data]);

  if (!isHR && !isSuperAdmin) {
    return <p className="text-sm text-[var(--gray-400)]">You do not have access to this page.</p>;
  }

  const toggle = (userId: number) => {
    setChecked((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const setIntent = (userId: number, value: boolean | null) => {
    setWillParticipate((prev) => ({ ...prev, [userId]: value }));
  };

  const handleSave = async () => {
    const userIds = new Set([...Object.keys(checked), ...Object.keys(willParticipate)].map(Number));
    const participants = Array.from(userIds).map((userId) => ({
      userId,
      participated: !!checked[userId],
      willParticipate: willParticipate[userId] ?? null,
    }));
    await recordMutation.mutateAsync(participants);
  };

  if (eventQuery.isLoading) return <p className="text-sm text-[var(--gray-400)]">Loading...</p>;
  if (!eventQuery.data) return <p className="text-sm text-red-500">Event not found</p>;

  const { event } = eventQuery.data;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)]">{event.name}</h1>
        <p className="text-[var(--gray-400)]">
          {new Date(event.eventDate).toLocaleDateString()} {event.location ? `· ${event.location}` : ''}
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--gray-100)] p-4 space-y-1 max-h-[60vh] overflow-y-auto">
        {employees.map((employee) => (
          <div
            key={employee.id}
            className="flex items-center justify-between gap-3 px-2 py-2 rounded-lg hover:bg-[var(--gray-25)]"
          >
            <label className="flex items-center gap-3 cursor-pointer min-w-0">
              <input
                type="checkbox"
                checked={!!checked[employee.id]}
                onChange={() => toggle(employee.id)}
                className="h-4 w-4 rounded border-[var(--gray-300)] text-[var(--primary)] focus:ring-[var(--primary-ring)]"
              />
              <span className="text-sm text-[var(--foreground)] truncate">
                {employee.first_name} {employee.last_name}
                <span className="text-[var(--gray-400)]"> · {employee.email}</span>
              </span>
            </label>
            <select
              value={willParticipate[employee.id] === null || willParticipate[employee.id] === undefined
                ? 'none'
                : willParticipate[employee.id]
                ? 'yes'
                : 'no'}
              onChange={(e) =>
                setIntent(
                  employee.id,
                  e.target.value === 'none' ? null : e.target.value === 'yes'
                )
              }
              className="text-sm rounded-lg border border-[var(--gray-300)] bg-[var(--background)] px-2 py-1 shrink-0"
            >
              <option value="none">No response</option>
              <option value="yes">Said: will attend</option>
              <option value="no">Said: won&apos;t attend</option>
            </select>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} isLoading={recordMutation.isPending}>
          Save Attendance
        </Button>
      </div>
    </div>
  );
}
