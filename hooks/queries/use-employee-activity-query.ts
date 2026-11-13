import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { employeeActivityService } from '@/lib/services/employee-activity.service';
import type { EmployeeActivityLogsParams } from '@/types/employee-activity';

// Admin views poll so a live employee's events show up without a manual refresh.
const REFETCH_MS = 10_000;

export const useEmployeeActivityLogsQuery = (params: EmployeeActivityLogsParams, enabled = true) =>
  useQuery({
    queryKey: ['employee-activity', 'logs', params],
    queryFn: () => employeeActivityService.getLogs(params),
    enabled,
    refetchInterval: REFETCH_MS,
    placeholderData: keepPreviousData,
  });

// Presence expires on the server after 45s, so poll a bit faster than the other views.
export const useAgentPresenceQuery = (enabled = true) =>
  useQuery({
    queryKey: ['employee-activity', 'presence'],
    queryFn: () => employeeActivityService.getPresence(),
    enabled,
    refetchInterval: 5_000,
  });

export const useEmployeeActivitySummaryQuery = (params: Pick<EmployeeActivityLogsParams, 'from' | 'to'>, enabled = true) =>
  useQuery({
    queryKey: ['employee-activity', 'summary', params],
    queryFn: () => employeeActivityService.getSummary(params),
    enabled,
    refetchInterval: REFETCH_MS,
  });
