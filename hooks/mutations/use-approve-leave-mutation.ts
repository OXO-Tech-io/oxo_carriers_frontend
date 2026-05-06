import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  leaveService,
  type ApproveLeaveInput,
} from '@/lib/services/leave.service';

export const useApproveLeaveMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: ApproveLeaveInput }) =>
      leaveService.approveLeaveRequest(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leaves'] });
    },
  });
};
