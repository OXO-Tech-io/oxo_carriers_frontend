import { useQuery } from '@tanstack/react-query';
import { workLogService, type ListWorkLogsParams } from '@/lib/services/work-log.service';

export const useMyWorkLogsQuery = (params: ListWorkLogsParams = {}) =>
  useQuery({
    queryKey: ['work-logs', 'mine', params],
    queryFn: () => workLogService.listMine(params),
  });

export const useAllWorkLogsQuery = (params: ListWorkLogsParams = {}, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['work-logs', 'all', params],
    queryFn: () => workLogService.listAll(params),
    enabled: options?.enabled,
  });

export const useWorkLogSummaryQuery = (params: ListWorkLogsParams = {}) =>
  useQuery({
    queryKey: ['work-logs', 'summary', params],
    queryFn: () => workLogService.getSummary(params),
  });

export const useWorkLogDailyStatusQuery = (date: string) =>
  useQuery({
    queryKey: ['work-logs', 'daily-status', date],
    queryFn: () => workLogService.getDailyStatus(date),
  });

export const workLogDeadlineQueryKey = (workDate?: string) =>
  ['work-logs', 'deadline', workDate ?? 'today'] as const;

export const useWorkLogDeadlineQuery = (workDate?: string) =>
  useQuery({
    queryKey: workLogDeadlineQueryKey(workDate),
    queryFn: () => workLogService.getDeadline(workDate),
  });
