import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/lib/services/profile.service';

export const changeRequestDetailQueryKey = (id: number | undefined) =>
  ['profile-change-requests', 'detail', id] as const;

export const useChangeRequestDetailQuery = (id: number | undefined, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: changeRequestDetailQueryKey(id),
    queryFn: () => profileService.getChangeRequestById(id as number),
    enabled: (options?.enabled ?? true) && !!id,
  });
