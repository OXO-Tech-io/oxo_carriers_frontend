import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  leaveService,
  type RejectLeaveInput,
} from '@/lib/services/leave.service';

export const useRejectLeaveMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: RejectLeaveInput }) =>
      leaveService.rejectLeaveRequest(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
};
