import { useQuery } from '@tanstack/react-query';
import { noticeService } from '@/lib/services/notice.service';

/** Active notices - the dashboard widget every employee/system user sees. */
export const useNoticesQuery = () =>
  useQuery({
    queryKey: ['notices', 'list'],
    queryFn: () => noticeService.list(),
  });

/** Full board (including inactive) for holders of the `notices` write permission. */
export const useManageNoticesQuery = (enabled = true) =>
  useQuery({
    queryKey: ['notices', 'manage'],
    queryFn: () => noticeService.listAll(),
    enabled,
  });
