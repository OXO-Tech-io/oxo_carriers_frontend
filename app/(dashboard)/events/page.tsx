'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useEventsQuery } from '@/hooks/queries/use-events-query';
import { useCreateEventMutation } from '@/hooks/mutations/use-event-mutations';
import { Modal, Button, DataTable } from '@/components/ui';
import type { ColumnDef } from '@tanstack/react-table';
import type { HrEvent } from '@/types/hrModules';

const createEventSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  eventDate: z.string().min(1, 'Event date is required'),
  location: z.string().optional(),
});
type CreateEventForm = z.infer<typeof createEventSchema>;

export default function EventsPage() {
  const { isHR, isSuperAdmin } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const eventsQuery = useEventsQuery();
  const createMutation = useCreateEventMutation();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateEventForm>({
    resolver: zodResolver(createEventSchema),
  });

  if (!isHR && !isSuperAdmin) {
    return <p className="text-sm text-[var(--gray-400)]">You do not have access to this page.</p>;
  }

  const onSubmit = async (values: CreateEventForm) => {
    await createMutation.mutateAsync(values);
    reset();
    setShowCreateModal(false);
  };

  const columns: ColumnDef<HrEvent, any>[] = [
    { accessorKey: 'name', header: 'Event Name' },
    {
      accessorKey: 'eventDate',
      header: 'Date',
      cell: ({ row }) => new Date(row.original.eventDate).toLocaleDateString(),
    },
    { accessorKey: 'location', header: 'Location', cell: ({ row }) => row.original.location || '—' },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Link href={`/events/${row.original.id}`} className="text-sm font-semibold text-[var(--primary)] hover:underline">
          Record Attendance
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">Events</h1>
          <p className="text-[var(--gray-400)]">Create events and record employee participation</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>Create Event</Button>
      </div>

      <DataTable columns={columns} data={eventsQuery.data ?? []} isLoading={eventsQuery.isLoading} />

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Event">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-[var(--foreground)]">Event Name</label>
            <input
              {...register('name')}
              className="mt-1 w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-2.5 text-sm text-[var(--foreground)]"
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
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
            <label className="text-sm font-semibold text-[var(--foreground)]">Event Date</label>
            <input
              type="date"
              {...register('eventDate')}
              className="mt-1 w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-2.5 text-sm text-[var(--foreground)]"
            />
            {errors.eventDate && <p className="text-xs text-red-500 mt-1">{errors.eventDate.message}</p>}
          </div>
          <div>
            <label className="text-sm font-semibold text-[var(--foreground)]">Location</label>
            <input
              {...register('location')}
              className="mt-1 w-full rounded-xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-2.5 text-sm text-[var(--foreground)]"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={createMutation.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
