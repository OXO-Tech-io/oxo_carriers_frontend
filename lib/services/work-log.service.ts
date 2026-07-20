import api from '@/lib/api';
import { extractData } from '@/lib/services/http';
import type { ApiResponse } from '@/types/api';
import type { BulkUploadResult, WorkLog, WorkLogEntryDraft, WorkLogUserSummary } from '@/types/hrModules';

export interface ListWorkLogsParams {
  from?: string;
  to?: string;
  userId?: number;
}

export const workLogService = {
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
    const res = await api.post<ApiResponse<BulkUploadResult>>('/work-logs/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return extractData(res);
  },
};
