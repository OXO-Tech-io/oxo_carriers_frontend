import { useQuery } from '@tanstack/react-query';
import { profileService, type ListChangeRequestsParams } from '@/lib/services/profile.service';

export const allChangeRequestsQueryKey = (params: ListChangeRequestsParams = {}) =>
  ['profile-change-requests', 'all', params] as const;

export const useAllChangeRequestsQuery = (
  params: ListChangeRequestsParams = {},
  options?: { enabled?: boolean }
) =>
  useQuery({
    queryKey: allChangeRequestsQueryKey(params),
    queryFn: () => profileService.listChangeRequests(params),
    enabled: options?.enabled ?? true,
  });
