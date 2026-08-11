'use client';

import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAttendanceAccess, type AccessLevel } from '@/hooks/queries/use-my-permissions-query';

interface AttendanceAccessGateProps {
  children: ReactNode;
  requiredLevel?: AccessLevel;
}

/**
 * Page-level gate for the admin attendance views.
 *
 * `ProtectedRoute` in `app/admin/layout.tsx` already establishes that someone is
 * signed in; this adds the `attendance` permission check on top, mirroring how
 * `app/admin/work-logs/page.tsx` renders an inline "no access" message rather
 * than redirecting. It checks the permission key rather than a role because
 * that is what the backend's PermissionGuard actually enforces - the server
 * remains the real gate, this only avoids showing a page that would 403.
 */
export function AttendanceAccessGate({
  children,
  requiredLevel = 'read',
}: AttendanceAccessGateProps) {
  const { canAccess, isLoading } = useAttendanceAccess(requiredLevel);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!canAccess) {
    return (
      <p className="text-sm text-[var(--gray-400)]">You do not have access to this page.</p>
    );
  }

  return <>{children}</>;
}
