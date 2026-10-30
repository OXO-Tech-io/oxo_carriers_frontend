import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { agentActivityService } from '@/lib/services/agent-activity.service';
import type { AgentActivityLogsParams } from '@/types/agent-activity';

// Admin views poll so a live employee's events show up without a manual refresh.
const REFETCH_MS = 10_000;

export const useAgentActivityLogsQuery = (params: AgentActivityLogsParams, enabled = true) =>
  useQuery({
    queryKey: ['agent-activity', 'logs', params],
    queryFn: () => agentActivityService.getLogs(params),
    enabled,
    refetchInterval: REFETCH_MS,
    placeholderData: keepPreviousData,
  });

export const useAgentActivitySummaryQuery = (params: Pick<AgentActivityLogsParams, 'from' | 'to'>, enabled = true) =>
  useQuery({
    queryKey: ['agent-activity', 'summary', params],
    queryFn: () => agentActivityService.getSummary(params),
    enabled,
    refetchInterval: REFETCH_MS,
  });
