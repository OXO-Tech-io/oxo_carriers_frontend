import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/lib/services/profile.service';

export const employeeWelfareInfoQueryKey = (employeeUserId: number | undefined) =>
  ['employee-welfare-info', employeeUserId] as const;

export const useEmployeeWelfareInfoQuery = (employeeUserId: number | undefined, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: employeeWelfareInfoQueryKey(employeeUserId),
    queryFn: () => profileService.getWelfareInfo(employeeUserId as number),
    enabled: (options?.enabled ?? true) && !!employeeUserId,
  });
