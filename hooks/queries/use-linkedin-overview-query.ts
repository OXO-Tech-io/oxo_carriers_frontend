import { useQuery } from '@tanstack/react-query';
import { linkedinService } from '@/lib/services/linkedin.service';

export const linkedinOverviewQueryKey = ['linkedin-overview'] as const;

// While any sync is pending the importer will pick it up on its next pass - poll so rows update on their own.
export const useLinkedinOverviewQuery = (enabled = true) =>
  useQuery({
    queryKey: linkedinOverviewQueryKey,
    queryFn: () => linkedinService.overview(),
    enabled,
    refetchInterval: (query) => (query.state.data?.some((r) => r.syncPending) ? 30_000 : false),
  });
