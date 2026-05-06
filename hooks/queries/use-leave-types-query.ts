import { useQuery } from '@tanstack/react-query';
import { leaveService } from '@/lib/services/leave.service';

export const leaveTypesQueryKey = ['leaves', 'types'] as const;

export const useLeaveTypesQuery = () =>
  useQuery({
    queryKey: leaveTypesQueryKey,
    queryFn: () => leaveService.getLeaveTypes(),
  });
