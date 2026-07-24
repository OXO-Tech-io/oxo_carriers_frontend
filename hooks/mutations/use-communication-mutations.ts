import { useMutation, useQueryClient } from '@tanstack/react-query';
import { communicationService } from '@/lib/services/communication.service';

export const useCreateCommunicationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      title,
      body,
      recipientUserIds,
      recipientGroupIds,
      files,
      requiresAcknowledgement,
      deadlineAt,
    }: {
      title: string;
      body: string;
      recipientUserIds: number[];
      recipientGroupIds: number[];
      files: File[];
      requiresAcknowledgement?: boolean;
      deadlineAt?: string | null;
    }) => communicationService.create(title, body, recipientUserIds, recipientGroupIds, files, requiresAcknowledgement, deadlineAt),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['communications'] });
    },
  });
};

export const useRespondCommunicationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, responseText }: { id: number; responseText?: string }) => communicationService.respond(id, responseText),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['communications', 'mine'] });
    },
  });
};

export const useDeleteCommunicationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => communicationService.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['communications'] });
    },
  });
};
