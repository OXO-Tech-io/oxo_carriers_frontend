import { useMutation, useQueryClient } from '@tanstack/react-query';
import { linkedinService } from '@/lib/services/linkedin.service';
import { linkedinOverviewQueryKey } from '@/hooks/queries/use-linkedin-overview-query';

type Action = 'connect' | 'disconnect' | 'refresh';

/** Per-employee action (admin). Refreshes the overview list afterwards. */
export const useLinkedinMutation = (action: Action) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => linkedinService[action](userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: linkedinOverviewQueryKey }),
  });
};

/** Connect every employee that has a LinkedIn URL and queue a sync for all of them. */
export const useLinkedinSyncAllMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => linkedinService.syncAll(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: linkedinOverviewQueryKey }),
  });
};
