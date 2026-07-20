import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/lib/services/profile.service';

export const employeePiiQueryKey = (userId: number | undefined) => ['employee-pii', userId] as const;

export const useEmployeePiiQuery = (userId: number | undefined, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: employeePiiQueryKey(userId),
    queryFn: () => profileService.getEmployeePii(userId as number),
    enabled: (options?.enabled ?? true) && !!userId,
  });
