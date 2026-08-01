import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/lib/services/profile.service';
import type { SubmitProfileChangeRequestInput } from '@/types/profile';

export const useSubmitProfileChangeMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SubmitProfileChangeRequestInput) => profileService.submitChangeRequest(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['profile-change-requests'] });
    },
  });
};
