import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/lib/services/profile.service';

export const profileQueryKey = () => ['profile', 'me'] as const;

export const useProfileQuery = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: profileQueryKey(),
    queryFn: () => profileService.getMyProfile(),
    enabled: options?.enabled ?? true,
  });
