import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formService, type CreateFormInput } from '@/lib/services/form.service';

export const useCreateFormMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFormInput) => formService.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['forms', 'list'] });
    },
  });
};

export const usePublishFormMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => formService.publish(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['forms', 'list'] });
    },
  });
};

export const useDistributeFormMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userIds }: { id: number; userIds: number[] }) => formService.distribute(id, userIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['forms', 'list'] });
    },
  });
};

export const useSubmitFormResponseMutation = (formId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ answers, files }: { answers: { fieldId: number; value?: string }[]; files: Record<number, File> }) =>
      formService.submitResponse(formId, answers, files),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['forms', 'mine'] });
    },
  });
};
