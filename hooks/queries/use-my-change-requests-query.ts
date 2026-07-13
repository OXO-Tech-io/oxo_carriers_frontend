import { useQuery } from '@tanstack/react-query';
import { profileService, type ListChangeRequestsParams } from '@/lib/services/profile.service';

export const myChangeRequestsQueryKey = (params: ListChangeRequestsParams = {}) =>
  ['profile-change-requests', 'mine', params] as const;

export const useMyChangeRequestsQuery = (
  params: ListChangeRequestsParams = {},
  options?: { enabled?: boolean }
) =>
  useQuery({
    queryKey: myChangeRequestsQueryKey(params),
    queryFn: () => profileService.listChangeRequests(params),
    enabled: options?.enabled ?? true,
  });
