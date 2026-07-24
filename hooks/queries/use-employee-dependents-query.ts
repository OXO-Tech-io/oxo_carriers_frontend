import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/lib/services/profile.service';

export const employeeDependentsQueryKey = (employeeId: string | undefined) => ['employee-dependents', employeeId] as const;

export const useEmployeeDependentsQuery = (employeeId: string | undefined, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: employeeDependentsQueryKey(employeeId),
    queryFn: () => profileService.getDependents(employeeId as string),
    enabled: (options?.enabled ?? true) && !!employeeId,
  });
