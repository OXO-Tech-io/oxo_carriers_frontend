import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eventService, type CreateEventInput, type RecordParticipationInput } from '@/lib/services/event.service';

export const useCreateEventMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEventInput) => eventService.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events', 'list'] });
    },
  });
};

export const useRecordParticipationMutation = (eventId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (participants: RecordParticipationInput[]) => eventService.recordParticipation(eventId, participants),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['events', 'detail', eventId] });
    },
  });
};
