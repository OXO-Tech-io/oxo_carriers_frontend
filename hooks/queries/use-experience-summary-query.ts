import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/lib/services/profile.service';

export const experienceSummaryQueryKey = (userId?: number) =>
  ['experience-summary', userId ?? 'me'] as const;

export const useExperienceSummaryQuery = (userId?: number, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: experienceSummaryQueryKey(userId),
    queryFn: () =>
      userId ? profileService.getExperienceSummaryForUser(userId) : profileService.getMyExperienceSummary(),
    enabled: options?.enabled ?? true,
  });
