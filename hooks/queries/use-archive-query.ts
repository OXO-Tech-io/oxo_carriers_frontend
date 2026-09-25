import { useQuery } from '@tanstack/react-query';
import { archiveService } from '@/lib/services/archive.service';

export const archiveListQueryKey = () => ['archive', 'list'] as const;

export const useArchiveListQuery = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: archiveListQueryKey(),
    queryFn: () => archiveService.listAll(),
    enabled: options?.enabled ?? true,
  });
