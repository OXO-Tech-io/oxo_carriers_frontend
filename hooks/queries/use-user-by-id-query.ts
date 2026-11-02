import { useQuery } from '@tanstack/react-query';
import { profileService } from '@/lib/services/profile.service';

export const userByIdQueryKey = (userId: number | undefined) => ['user-by-id', userId] as const;

// OCD-603/604: HR loading another employee's profile for the Edit Profile wizard.
export const useUserByIdQuery = (userId: number | undefined) =>
  useQuery({
    queryKey: userByIdQueryKey(userId),
    queryFn: () => profileService.getUserById(userId as number),
    enabled: !!userId,
  });
