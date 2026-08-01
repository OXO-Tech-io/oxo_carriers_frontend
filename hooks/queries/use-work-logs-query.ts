import { useQuery } from '@tanstack/react-query';
import { workLogService, type ListWorkLogsParams } from '@/lib/services/work-log.service';

export const useMyWorkLogsQuery = (params: ListWorkLogsParams = {}) =>
  useQuery({
    queryKey: ['work-logs', 'mine', params],
    queryFn: () => workLogService.listMine(params),
  });

export const useAllWorkLogsQuery = (params: ListWorkLogsParams = {}) =>
  useQuery({
    queryKey: ['work-logs', 'all', params],
    queryFn: () => workLogService.listAll(params),
  });

export const useWorkLogSummaryQuery = (params: ListWorkLogsParams = {}) =>
  useQuery({
    queryKey: ['work-logs', 'summary', params],
    queryFn: () => workLogService.getSummary(params),
  });
