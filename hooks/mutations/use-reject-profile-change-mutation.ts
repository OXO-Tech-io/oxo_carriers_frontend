import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/lib/services/profile.service';

export const useRejectProfileChangeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reviewerComments }: { id: number; reviewerComments: string }) =>
      profileService.rejectChangeRequest(id, reviewerComments),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile-change-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
