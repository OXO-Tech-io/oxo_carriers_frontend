'use client';

import { useState, type ReactNode } from 'react';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';
import { Skeleton } from './Skeleton';

interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  isLoading?: boolean;
  emptyState?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  getRowId?: (row: TData) => string;
  onRowClick?: (row: TData) => void;
  pageSize?: number;
  sortable?: boolean;
  /** Set when the caller fetches one page at a time from the server. */
  manualPagination?: boolean;
  pageCount?: number;
  pageIndex?: number;
  onPageChange?: (index: number) => void;
  className?: string;
}

// Generic, reusable data table built on @tanstack/react-table (previously an
// installed-but-unused dependency). Replaces the hand-rolled raw <table>
// markup duplicated across leaves/facilities/admin-users pages, and the empty
// components/ui/Table.tsx stub. Reused by every list view in this phase
// (Education, Work History, Pending Changes, Profile Approvals) and intended
// to be reused by later phases (HR Notes, Communications, Form Responses,
// Work Logs) too.
export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  emptyState,
  emptyTitle = 'No records found',
  emptyDescription,
  getRowId,
  onRowClick,
  pageSize = 10,
  sortable = true,
  manualPagination = false,
  pageCount,
  pageIndex,
  onPageChange,
  className = '',
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [internalPageIndex, setInternalPageIndex] = useState(0);

  const isControlledPagination = manualPagination && pageIndex !== undefined && !!onPageChange;
  const currentPageIndex = isControlledPagination ? (pageIndex as number) : internalPageIndex;

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination: { pageIndex: currentPageIndex, pageSize },
    },
    onSortingChange: sortable ? setSorting : undefined,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: sortable ? getSortedRowModel() : undefined,
    getPaginationRowModel: manualPagination ? undefined : getPaginationRowModel(),
    manualPagination,
    pageCount: manualPagination ? pageCount ?? -1 : undefined,
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
    onPaginationChange: (updater) => {
      const next =
        typeof updater === 'function'
          ? updater({ pageIndex: currentPageIndex, pageSize })
          : updater;
      if (isControlledPagination) {
        onPageChange!(next.pageIndex);
      } else {
        setInternalPageIndex(next.pageIndex);
      }
    },
  });

  const rows = table.getRowModel().rows;
  const totalPageCount = manualPagination ? pageCount ?? 0 : table.getPageCount();

  if (isLoading) {
    return (
      <div className={`overflow-x-auto rounded-2xl border border-[var(--gray-100)] ${className}`}>
        <table className="min-w-full divide-y divide-[var(--gray-100)]">
          <thead className="bg-[var(--gray-25)]">
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className="px-6 py-3.5 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider"
                >
                  {typeof col.header === 'string' ? col.header : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-[var(--card-bg)] divide-y divide-[var(--gray-100)]">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map((_, j) => (
                  <td key={j} className="px-6 py-4">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (rows.length === 0) {
    return <>{emptyState ?? <EmptyState title={emptyTitle} description={emptyDescription} />}</>;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="overflow-x-auto rounded-2xl border border-[var(--gray-100)]">
        <table className="min-w-full divide-y divide-[var(--gray-100)]">
          <thead className="bg-[var(--gray-25)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className={`px-6 py-3.5 text-left text-xs font-bold text-[var(--gray-400)] uppercase tracking-wider ${
                      header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                    }`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex items-center gap-1.5">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' && <ChevronUp className="h-3.5 w-3.5" />}
                        {header.column.getIsSorted() === 'desc' && <ChevronDown className="h-3.5 w-3.5" />}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-[var(--card-bg)] divide-y divide-[var(--gray-100)]">
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row.original)}
                className={onRowClick ? 'cursor-pointer hover:bg-[var(--gray-25)] transition-colors' : ''}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 text-sm text-[var(--foreground)]">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPageCount > 1 && (
        <Pagination
          pageIndex={currentPageIndex}
          pageCount={totalPageCount}
          onPageChange={(i) => (isControlledPagination ? onPageChange!(i) : setInternalPageIndex(i))}
        />
      )}
    </div>
  );
}
