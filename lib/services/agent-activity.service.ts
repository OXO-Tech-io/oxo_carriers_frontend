import api from '@/lib/api';
import { extractData } from '@/lib/services/http';
import type { ApiResponse } from '@/types/api';
import type {
  AgentActivityLogsPage,
  AgentActivityLogsParams,
  AgentActivitySummary,
  AgentLogPayload,
} from '@/types/agent-activity';

export const agentActivityService = {
  /** Employee's own tab relays frames from the local agent here. */
  ingest: async (logs: AgentLogPayload[]): Promise<{ received: number; stored: number; rejected: number }> => {
    const res = await api.post<ApiResponse<{ received: number; stored: number; rejected: number }>>(
      '/agent-activity/logs',
      { logs },
    );
    return extractData(res);
  },

  /** Admin view. */
  getLogs: async (params: AgentActivityLogsParams = {}): Promise<AgentActivityLogsPage> => {
    const res = await api.get<ApiResponse<AgentActivityLogsPage>>('/agent-activity/logs', { params });
    return extractData(res);
  },

  getSummary: async (params: Pick<AgentActivityLogsParams, 'from' | 'to'> = {}): Promise<AgentActivitySummary[]> => {
    const res = await api.get<ApiResponse<AgentActivitySummary[]>>('/agent-activity/summary', { params });
    return extractData(res);
  },
};
