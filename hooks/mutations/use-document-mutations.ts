import { useMutation, useQueryClient } from '@tanstack/react-query';
import { documentService, type CreateDocumentInput } from '@/lib/services/document.service';

export const useCreateDocumentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDocumentInput) => documentService.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};

export const useDeleteDocumentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => documentService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });
};
