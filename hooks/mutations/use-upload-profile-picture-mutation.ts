import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/lib/services/profile.service';
import { profileQueryKey } from '@/hooks/queries/use-profile-query';
import { useAuth } from '@/hooks/useAuth';

// OCD-454: uploads a new "My Profile" picture and refreshes the cached
// profile so the avatar (profile/page.tsx, Header.tsx) updates immediately.
export const useUploadProfilePictureMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (file: File) => {
      if (!user) throw new Error('Not authenticated');
      return profileService.uploadProfilePicture(user.id, file);
    },
    onSuccess: (user) => {
      queryClient.setQueryData(profileQueryKey(), user);
    },
  });
};
