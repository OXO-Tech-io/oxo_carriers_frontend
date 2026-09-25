'use client';

import { useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { useArchiveListQuery } from '@/hooks/queries/use-archive-query';
import ArchiveDetailModal from '@/components/modals/ArchiveDetailModal';
import type { ArchivedEmployee } from '@/types/archive';
import type { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { Archive as ArchiveIcon, Search } from 'lucide-react';

// OCD-453: Administrators (and HR Manager, via the `archive` permission
// key - see defaultRolePermissions.ts) can review deleted employee profiles
// here: who was deleted, when, by whom, and the full profile snapshot as it
// existed at the moment of deletion.
export default function ArchivePage() {
  const { isSuperAdmin, isHRManager } = useAuth();
  // Sidebar already gates visibility of this nav item on the `archive`
  // permission - this is a defense-in-depth check for direct navigation.
  const canAccess = isSuperAdmin || isHRManager;

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<ArchivedEmployee | null>(null);
  const archiveQuery = useArchiveListQuery({ enabled: canAccess });

  const filtered = useMemo(() => {
    const rows = archiveQuery.data ?? [];
    if (!search.trim()) return rows;
    const term = search.trim().toLowerCase();
    return rows.filter((row) => {
      const employee = row.snapshot?.employee;
      const haystack = [employee?.firstName, employee?.lastName, employee?.email, row.employeeId, row.deletedByName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [archiveQuery.data, search]);

  const columns: ColumnDef<ArchivedEmployee, unknown>[] = [
    {
      header: 'Employee',
      cell: ({ row }) => {
        const employee = row.original.snapshot?.employee;
        return (
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {employee?.firstName} {employee?.lastName}
            </p>
            <p className="text-xs text-[var(--gray-400)]">{employee?.email}</p>
            <p className="text-[10px] text-[var(--gray-400)] mt-0.5">ID: {row.original.employeeId}</p>
          </div>
        );
      },
    },
    {
      header: 'Role',
      cell: ({ row }) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--gray-50)] text-[var(--gray-600)] capitalize">
          {(row.original.snapshot?.employee?.role ?? '').toString().replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      header: 'Deleted At',
      accessorKey: 'deletedAt',
      cell: ({ getValue }) => {
        const value = getValue<string>();
        try {
          return format(new Date(value), 'MMM dd, yyyy, h:mm a');
        } catch {
          return value;
        }
      },
    },
    {
      header: 'Deleted By',
      cell: ({ row }) => row.original.deletedByName || '—',
    },
  ];

  if (!canAccess) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <p className="text-lg font-semibold text-[var(--foreground)]">Access Denied</p>
          <p className="text-[var(--gray-400)]">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-[var(--foreground)] flex items-center gap-3">
          <ArchiveIcon className="h-7 w-7 text-[var(--primary)]" />
          Archive
        </h1>
        <p className="mt-2 text-[var(--gray-400)]">
          Deleted employee profiles, captured with a full snapshot, deletion timestamp, and who performed the deletion.
        </p>
      </div>

      <Card padding="sm">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-[var(--gray-400)]" />
          </div>
          <input
            type="text"
            placeholder="Search archived employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-[var(--gray-200)] rounded-lg text-sm text-[var(--foreground)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-ring)] bg-[var(--card-bg)]"
          />
        </div>
      </Card>

      <Card padding="none" className="overflow-hidden">
        <DataTable
          columns={columns}
          data={filtered}
          isLoading={archiveQuery.isLoading}
          onRowClick={(row) => setSelected(row)}
          emptyTitle="No archived employees"
          emptyDescription="Deleted employee profiles will appear here."
        />
      </Card>

      <ArchiveDetailModal isOpen={!!selected} onClose={() => setSelected(null)} record={selected} />
    </div>
  );
}
