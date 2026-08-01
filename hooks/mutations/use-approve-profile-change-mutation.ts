import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/lib/services/profile.service';

export const useApproveProfileChangeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reviewerComments }: { id: number; reviewerComments?: string }) =>
      profileService.approveChangeRequest(id, reviewerComments),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile-change-requests'] });
      void queryClient.invalidateQueries({ queryKey: ['profile'] });
      void queryClient.invalidateQueries({ queryKey: ['employee-education'] });
      void queryClient.invalidateQueries({ queryKey: ['employee-work-history'] });
      void queryClient.invalidateQueries({ queryKey: ['employee-pii'] });
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
