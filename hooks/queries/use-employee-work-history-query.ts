import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/lib/services/profile.service';

export const employeeWorkHistoryQueryKey = (userId?: number) =>
  ['employee-work-history', userId ?? 'me'] as const;

export const useEmployeeWorkHistoryQuery = (userId?: number, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: employeeWorkHistoryQueryKey(userId),
    queryFn: () =>
      userId ? profileService.getWorkHistoryForUser(userId) : profileService.getMyWorkHistory(),
    enabled: options?.enabled ?? true,
  });
