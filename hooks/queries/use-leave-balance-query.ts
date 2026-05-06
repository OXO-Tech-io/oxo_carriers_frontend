import { useQuery } from '@tanstack/react-query';
import { leaveService } from '@/lib/services/leave.service';

export const leaveBalanceQueryKey = (year?: number) =>
  ['leaves', 'balance', year ?? 'current'] as const;

export const useLeaveBalanceQuery = (year?: number) =>
  useQuery({
    queryKey: leaveBalanceQueryKey(year),
    queryFn: () => leaveService.getLeaveBalance(year),
  });
