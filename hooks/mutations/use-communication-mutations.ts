import { useMutation, useQueryClient } from '@tanstack/react-query';
import { communicationService } from '@/lib/services/communication.service';

export const useCreateCommunicationMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ title, body, recipientUserIds, files }: { title: string; body: string; recipientUserIds: number[]; files: File[] }) =>
      communicationService.create(title, body, recipientUserIds, files),
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
