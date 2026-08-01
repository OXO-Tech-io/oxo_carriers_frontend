import { useQuery } from '@tanstack/react-query';
import { groupService } from '@/lib/services/group.service';

export const useGroupsQuery = () =>
  useQuery({
    queryKey: ['groups', 'list'],
    queryFn: () => groupService.list(),
  });

export const useGroupQuery = (id: number | null) =>
  useQuery({
    queryKey: ['groups', 'detail', id],
    queryFn: () => groupService.getById(id as number),
    enabled: id !== null,
  });
