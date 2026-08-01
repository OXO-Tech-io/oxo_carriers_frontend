import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/lib/services/profile.service';

export const employeePersonalDetailsQueryKey = (userId: number | undefined) => ['employee-personal-details', userId] as const;

export const useEmployeePersonalDetailsQuery = (userId: number | undefined, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: employeePersonalDetailsQueryKey(userId),
    queryFn: () => profileService.getEmployeePersonalDetails(userId as number),
    enabled: (options?.enabled ?? true) && !!userId,
  });
