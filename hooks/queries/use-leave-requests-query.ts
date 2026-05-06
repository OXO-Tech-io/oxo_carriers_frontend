import { useQuery } from '@tanstack/react-query';
import {
  leaveService,
  type ListLeaveRequestsParams,
} from '@/lib/services/leave.service';

export const leaveRequestsQueryKey = (params: ListLeaveRequestsParams = {}) =>
  ['leaves', 'list', params] as const;

export const useLeaveRequestsQuery = (
  params: ListLeaveRequestsParams = {},
  options?: { enabled?: boolean }
) =>
  useQuery({
    queryKey: leaveRequestsQueryKey(params),
    queryFn: () => leaveService.listLeaveRequests(params),
    enabled: options?.enabled ?? true,
  });
