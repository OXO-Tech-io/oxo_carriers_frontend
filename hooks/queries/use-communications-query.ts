import { useQuery } from '@tanstack/react-query';
import { communicationService } from '@/lib/services/communication.service';

export const useCommunicationsQuery = () =>
  useQuery({
    queryKey: ['communications', 'list'],
    queryFn: () => communicationService.listAll(),
  });

export const useMyCommunicationsQuery = () =>
  useQuery({
    queryKey: ['communications', 'mine'],
    queryFn: () => communicationService.listMine(),
  });
