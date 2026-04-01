'use client';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[var(--gray-200)] ${className}`}
      aria-hidden
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--gray-200)] bg-[var(--card-bg)] p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-16" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
      <div className="mt-4">
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-[var(--gray-200)]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-7 w-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
