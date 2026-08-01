import { useQuery } from '@tanstack/react-query';
import { communicationService } from '@/lib/services/communication.service';
import { useAuth } from '@/hooks/useAuth';

export const useCommunicationsQuery = () =>
  useQuery({
    queryKey: ['communications', 'list'],
    queryFn: () => communicationService.listAll(),
  });

export const useMyCommunicationsQuery = () => {
  const { user } = useAuth();
  const employeeId = user?.employee_id;

  return useQuery({
    queryKey: ['communications', 'mine', employeeId],
    queryFn: () => communicationService.listMine(employeeId!),
    enabled: !!employeeId,
  });
};
