import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/lib/services/profile.service';

export const employeeEducationQueryKey = (userId?: number) =>
  ['employee-education', userId ?? 'me'] as const;

export const useEmployeeEducationQuery = (userId?: number, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: employeeEducationQueryKey(userId),
    queryFn: () => (userId ? profileService.getEducationForUser(userId) : profileService.getMyEducation()),
    enabled: options?.enabled ?? true,
  });
