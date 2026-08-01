import { useQuery } from '@tanstack/react-query';
import { eventService } from '@/lib/services/event.service';

export const useEventsQuery = () =>
  useQuery({
    queryKey: ['events', 'list'],
    queryFn: () => eventService.list(),
  });

export const useEventQuery = (id: number) =>
  useQuery({
    queryKey: ['events', 'detail', id],
    queryFn: () => eventService.getWithParticipants(id),
    enabled: !!id,
  });
