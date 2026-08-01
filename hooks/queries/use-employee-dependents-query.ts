import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/lib/services/profile.service';

export const employeeDependentsQueryKey = (employeeUserId: number | undefined) => ['employee-dependents', employeeUserId] as const;

export const useEmployeeDependentsQuery = (employeeUserId: number | undefined, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: employeeDependentsQueryKey(employeeUserId),
    queryFn: () => profileService.getDependents(employeeUserId as number),
    enabled: (options?.enabled ?? true) && !!employeeUserId,
  });
