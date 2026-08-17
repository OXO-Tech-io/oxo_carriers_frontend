import { useMutation, useQueryClient } from '@tanstack/react-query';
import { noticeService, type CreateNoticeInput, type UpdateNoticeInput } from '@/lib/services/notice.service';

export const useCreateNoticeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateNoticeInput) => noticeService.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notices'] });
    },
  });
};

export const useUpdateNoticeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateNoticeInput }) => noticeService.update(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notices'] });
    },
  });
};

export const useDeleteNoticeMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => noticeService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notices'] });
    },
  });
};
