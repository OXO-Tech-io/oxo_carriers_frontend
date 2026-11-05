import api from '@/lib/api';
import { extractData } from '@/lib/services/http';
import type { ApiResponse } from '@/types/api';
import type {
  EmployeeActivityLogsPage,
  EmployeeActivityLogsParams,
  EmployeeActivitySummary,
  AgentLogPayload,
} from '@/types/employee-activity';

export const employeeActivityService = {
  /** Employee's own tab relays frames from the local agent here. */
  ingest: async (logs: AgentLogPayload[]): Promise<{ received: number; stored: number; rejected: number }> => {
    const res = await api.post<ApiResponse<{ received: number; stored: number; rejected: number }>>(
      '/employee-activities/logs',
      { logs },
    );
    return extractData(res);
  },

  /** Screenshot handed over by the local agent; stored under the signed-in employee's assigned device. */
  uploadScreenshot: async (input: {
    eventId: number;
    deviceId: string;
    mimeType: string;
    fileName: string;
    capturedAt: string;
    blob: Blob;
  }): Promise<{ stored: boolean }> => {
    const form = new FormData();
    form.append('eventId', String(input.eventId));
    form.append('deviceId', input.deviceId);
    form.append('mimeType', input.mimeType);
    form.append('fileName', input.fileName);
    form.append('capturedAt', input.capturedAt);
    form.append('file', input.blob, input.fileName);
    const res = await api.post<ApiResponse<{ stored: boolean }>>('/employee-activities/screenshots', form);
    return extractData(res);
  },

  /** Admin view. */
  getLogs: async (params: EmployeeActivityLogsParams = {}): Promise<EmployeeActivityLogsPage> => {
    const res = await api.get<ApiResponse<EmployeeActivityLogsPage>>('/employee-activities/logs', { params });
    return extractData(res);
  },

  /** Image bytes (auth'd, so not an <img src>). Caller owns the returned blob. */
  getScreenshot: async (id: number): Promise<Blob> => {
    const res = await api.get<Blob>(`/employee-activities/screenshots/${id}`, { responseType: 'blob' });
    return res.data;
  },

  getSummary: async (params: Pick<EmployeeActivityLogsParams, 'from' | 'to'> = {}): Promise<EmployeeActivitySummary[]> => {
    const res = await api.get<ApiResponse<EmployeeActivitySummary[]>>('/employee-activities/summaries', { params });
    return extractData(res);
  },

  /** Issues a device token for the agent's direct API upload. Plaintext is returned once; older tokens are revoked. */
  issueDeviceToken: async (employeeId: string): Promise<{ token: string; deviceId: string }> => {
    const res = await api.post<ApiResponse<{ token: string; deviceId: string }>>(
      `/employee-activities/devices/${encodeURIComponent(employeeId)}/tokens`,
    );
    return extractData(res);
  },

  revokeDeviceToken: async (employeeId: string): Promise<{ revoked: number }> => {
    const res = await api.delete<ApiResponse<{ revoked: number }>>(
      `/employee-activities/devices/${encodeURIComponent(employeeId)}/tokens`,
    );
    return extractData(res);
  },
};
