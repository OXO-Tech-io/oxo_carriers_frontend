import api from '@/lib/api';
import { extractData } from '@/lib/services/http';
import type { ApiResponse } from '@/types/api';
import type { Communication, CommunicationRecipient } from '@/types/hrModules';

export const communicationService = {
  create: async (title: string, body: string, recipientUserIds: number[], files: File[]): Promise<Communication> => {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('body', body);
    formData.append('recipientUserIds', JSON.stringify(recipientUserIds));
    files.forEach((file) => formData.append('attachments', file));
    const res = await api.post<ApiResponse<Communication>>('/communications', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return extractData(res);
  },

  listAll: async (): Promise<Communication[]> => {
    const res = await api.get<ApiResponse<Communication[]>>('/communications');
    return extractData(res);
  },

  listMine: async (): Promise<CommunicationRecipient[]> => {
    const res = await api.get<ApiResponse<CommunicationRecipient[]>>('/communications/mine');
    return extractData(res);
  },

  respond: async (id: number, responseText?: string): Promise<void> => {
    await api.post(`/communications/${id}/respond`, { responseText });
  },

  downloadReport: async (): Promise<Blob> => {
    const res = await api.get('/communications/report', { responseType: 'blob' });
    return res.data as Blob;
  },
};
