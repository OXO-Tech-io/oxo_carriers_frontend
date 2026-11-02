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

  /** Image bytes (auth'd, so not an <img src>). Caller owns the returned blob. */
  getScreenshot: async (id: number): Promise<Blob> => {
    const res = await api.get<Blob>(`/agent-activity/screenshots/${id}`, { responseType: 'blob' });
    return res.data;
  },

  getSummary: async (params: Pick<AgentActivityLogsParams, 'from' | 'to'> = {}): Promise<AgentActivitySummary[]> => {
    const res = await api.get<ApiResponse<AgentActivitySummary[]>>('/agent-activity/summary', { params });
    return extractData(res);
  },

  /** Issues a device token for the agent's direct API upload. Plaintext is returned once; older tokens are revoked. */
  issueDeviceToken: async (employeeId: string): Promise<{ token: string; deviceId: string }> => {
    const res = await api.post<ApiResponse<{ token: string; deviceId: string }>>(
      `/agent-activity/devices/${encodeURIComponent(employeeId)}/token`,
    );
    return extractData(res);
  },

  revokeDeviceToken: async (employeeId: string): Promise<{ revoked: number }> => {
    const res = await api.delete<ApiResponse<{ revoked: number }>>(
      `/agent-activity/devices/${encodeURIComponent(employeeId)}/token`,
    );
    return extractData(res);
  },
};
