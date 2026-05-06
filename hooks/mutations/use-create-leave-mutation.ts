import { useMutation, useQueryClient } from '@tanstack/react-query';
import { leaveService } from '@/lib/services/leave.service';

export const useCreateLeaveMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => leaveService.createLeaveRequest(formData),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
};
