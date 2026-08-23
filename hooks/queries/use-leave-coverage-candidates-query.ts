import { useQuery } from '@tanstack/react-query';
import { leaveService } from '@/lib/services/leave.service';

export const leaveCoverageCandidatesQueryKey = ['leaves', 'coverage-candidates'] as const;

export const useLeaveCoverageCandidatesQuery = (enabled = true) =>
  useQuery({
    queryKey: leaveCoverageCandidatesQueryKey,
    queryFn: () => leaveService.getCoverageCandidates(),
    enabled,
  });
