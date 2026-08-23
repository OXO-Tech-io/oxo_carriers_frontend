import { useQuery } from '@tanstack/react-query';
import { leaveService } from '@/lib/services/leave.service';

export const leaveCoverageCandidatesQueryKey = (startDate?: string, endDate?: string) =>
  ['leaves', 'coverage-candidates', startDate ?? null, endDate ?? null] as const;

// Refetches whenever the requested date range changes, so colleagues who
// already have overlapping leave drop out of the list as soon as both dates
// are picked.
export const useLeaveCoverageCandidatesQuery = (enabled = true, startDate?: string, endDate?: string) =>
  useQuery({
    queryKey: leaveCoverageCandidatesQueryKey(startDate, endDate),
    queryFn: () => leaveService.getCoverageCandidates({ startDate, endDate }),
    enabled,
  });
