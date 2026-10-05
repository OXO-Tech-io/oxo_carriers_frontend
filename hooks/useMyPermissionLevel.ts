'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

type AccessLevel = 'read' | 'write';

/**
 * Whether the signed-in user holds `key` at (at least) `required` via
 * GET /permissions/me. Super admin always passes. `loaded` is false until the
 * first answer arrives so pages can avoid flashing "no access".
 */
export function useMyPermissionLevel(key: string, required: AccessLevel = 'read') {
  const { user, isSuperAdmin } = useAuth();
  const [level, setLevel] = useState<AccessLevel | undefined>();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setLevel(undefined);
      setLoaded(true);
      return;
    }
    let cancelled = false;
    api
      .get('/permissions/me')
      .then((res) => {
        if (!cancelled) setLevel(res.data?.permissionLevels?.[key]);
      })
      .catch(() => {
        if (!cancelled) setLevel(undefined);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, key]);

  const allowed = isSuperAdmin || level === 'write' || (required === 'read' && level === 'read');
  return { allowed, loaded: loaded || isSuperAdmin };
}
