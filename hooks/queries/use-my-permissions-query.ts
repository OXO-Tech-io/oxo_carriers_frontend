import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

export type AccessLevel = 'read' | 'write';

export type PermissionLevels = Record<string, AccessLevel>;

/**
 * The caller's permission map, keyed exactly as the backend's PERMISSIONS
 * constants (`attendance`, `work_logs`, `leaves`, ...).
 *
 * `components/layout/Sidebar.tsx` and `app/(dashboard)/vouchers/page.tsx` each
 * inline their own copy of this fetch; this hook is the react-query version the
 * attendance pages use rather than adding a third copy. The response puts
 * `permissionLevels` at the top level of the body, not under `data`, so it is
 * read directly instead of through `extractData`.
 */
export const useMyPermissionsQuery = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['permissions', 'me', user?.id ?? null],
    enabled: !!user,
    queryFn: async (): Promise<PermissionLevels> => {
      const res = await api.get('/permissions/me');
      const levels = res.data?.permissionLevels;
      return levels && typeof levels === 'object' ? (levels as PermissionLevels) : {};
    },
  });
};

/** `write` satisfies a `read` requirement; `read` never satisfies `write`. */
export const hasAccessLevel = (
  levels: PermissionLevels | undefined,
  key: string,
  requiredLevel: AccessLevel = 'read',
): boolean => {
  const level = levels?.[key];
  if (!level) return false;
  if (level === 'write') return true;
  return requiredLevel === 'read';
};

/**
 * Access gate for the attendance pages: super admins bypass, everyone else
 * needs the `attendance` permission at the given level.
 *
 * `isLoading` matters - rendering "no access" before the map arrives would
 * flash a denial at users who do have it.
 */
export const useAttendanceAccess = (requiredLevel: AccessLevel = 'read') => {
  const { isSuperAdmin } = useAuth();
  const query = useMyPermissionsQuery();

  return {
    isLoading: !isSuperAdmin && query.isLoading,
    canAccess: isSuperAdmin || hasAccessLevel(query.data, 'attendance', requiredLevel),
  };
};
