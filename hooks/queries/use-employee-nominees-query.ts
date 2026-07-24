import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/lib/services/profile.service';

export const employeeNomineesQueryKey = (employeeId: string | undefined) => ['employee-nominees', employeeId] as const;

export const useEmployeeNomineesQuery = (employeeId: string | undefined, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: employeeNomineesQueryKey(employeeId),
    queryFn: () => profileService.getNominees(employeeId as string),
    enabled: (options?.enabled ?? true) && !!employeeId,
  });
