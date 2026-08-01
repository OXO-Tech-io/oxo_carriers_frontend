import { useQuery } from '@tanstack/react-query';
import { leaveService } from '@/lib/services/leave.service';

export const leaveBalanceQueryKey = (employeeId?: string | null, year?: number) =>
  ['leaves', 'balance', employeeId ?? 'unknown', year ?? 'current'] as const;

export const useLeaveBalanceQuery = (employeeId?: string | null, year?: number) =>
  useQuery({
    queryKey: leaveBalanceQueryKey(employeeId, year),
    queryFn: () => leaveService.getLeaveBalance(employeeId as string, year),
    enabled: !!employeeId,
  });
