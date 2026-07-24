import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/lib/services/profile.service';

export const employeeWelfareInfoQueryKey = (employeeId: string | undefined) =>
  ['employee-welfare-info', employeeId] as const;

export const useEmployeeWelfareInfoQuery = (employeeId: string | undefined, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: employeeWelfareInfoQueryKey(employeeId),
    queryFn: () => profileService.getWelfareInfo(employeeId as string),
    enabled: (options?.enabled ?? true) && !!employeeId,
  });
