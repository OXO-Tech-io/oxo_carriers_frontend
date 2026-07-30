import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/lib/services/profile.service';

export const employeeNomineesQueryKey = (employeeUserId: number | undefined) => ['employee-nominees', employeeUserId] as const;

export const useEmployeeNomineesQuery = (employeeUserId: number | undefined, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: employeeNomineesQueryKey(employeeUserId),
    queryFn: () => profileService.getNominees(employeeUserId as number),
    enabled: (options?.enabled ?? true) && !!employeeUserId,
  });
