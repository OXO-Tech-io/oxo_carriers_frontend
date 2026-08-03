import api from '@/lib/api';
import { extractData } from '@/lib/services/http';
import type { ApiResponse } from '@/types/api';
import type {
  BulkUploadResult,
  WorkLog,
  WorkLogDailyStatus,
  WorkLogDeadline,
  WorkLogDeadlineSettingsUpdate,
  WorkLogEntryDraft,
  WorkLogUserSummary,
} from '@/types/hrModules';

export interface ListWorkLogsParams {
  from?: string;
  to?: string;
  userId?: number;
}

export const workLogService = {
  /** Deadline as it applies to `workDate` (defaults to today server-side). */
  getDeadline: async (workDate?: string): Promise<WorkLogDeadline> => {
    const res = await api.get<ApiResponse<WorkLogDeadline>>('/work-logs/deadline', {
      params: workDate ? { workDate } : undefined,
    });
    return extractData(res);
  },

  updateDeadline: async (updates: WorkLogDeadlineSettingsUpdate): Promise<WorkLogDeadline> => {
    const res = await api.put<ApiResponse<WorkLogDeadline>>('/work-logs/deadline', updates);
    return extractData(res);
  },

  submit: async (entries: WorkLogEntryDraft[]): Promise<WorkLog[]> => {
    const res = await api.post<ApiResponse<WorkLog[]>>('/work-logs', { entries });
    return extractData(res);
  },

  listMine: async (params: ListWorkLogsParams = {}): Promise<WorkLog[]> => {
    const res = await api.get<ApiResponse<WorkLog[]>>('/work-logs/mine', { params });
    return extractData(res);
  },

  listAll: async (params: ListWorkLogsParams = {}): Promise<WorkLog[]> => {
    const res = await api.get<ApiResponse<WorkLog[]>>('/work-logs', { params });
    return extractData(res);
  },

  downloadTemplate: async (): Promise<Blob> => {
    const res = await api.get('/work-logs/template', { responseType: 'blob' });
    return res.data as Blob;
  },

  getSummary: async (params: ListWorkLogsParams = {}): Promise<WorkLogUserSummary[]> => {
    const res = await api.get<ApiResponse<WorkLogUserSummary[]>>('/work-logs/summary', { params });
    return extractData(res);
  },

  /** Attendance-style snapshot for a single day. Defaults to today server-side. */
  getDailyStatus: async (date?: string): Promise<WorkLogDailyStatus> => {
    const res = await api.get<ApiResponse<WorkLogDailyStatus>>('/work-logs/daily-status', {
      params: date ? { date } : undefined,
    });
    return extractData(res);
  },

  downloadSummaryReport: async (params: ListWorkLogsParams = {}): Promise<Blob> => {
    const res = await api.get('/work-logs/reports/summary', { params, responseType: 'blob' });
    return res.data as Blob;
  },

  downloadDetailedReport: async (params: ListWorkLogsParams = {}): Promise<Blob> => {
    const res = await api.get('/work-logs/reports/detailed', { params, responseType: 'blob' });
    return res.data as Blob;
  },

  bulkUpload: async (file: File): Promise<BulkUploadResult> => {
    const formData = new FormData();
    formData.append('excel', file);
    const res = await api.post<ApiResponse<BulkUploadResult>>('/work-logs/bulk-uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return extractData(res);
  },
};
