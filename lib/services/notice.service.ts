import api from '@/lib/api';
import { extractData } from '@/lib/services/http';
import type { ApiResponse } from '@/types/api';
import type { Notice } from '@/types/hrModules';

export interface CreateNoticeInput {
  title: string;
  message: string;
  isActive?: boolean;
}

export type UpdateNoticeInput = Partial<CreateNoticeInput>;

export const noticeService = {
  /** Active notices only - what every employee/system user sees on their dashboard. */
  list: async (): Promise<Notice[]> => {
    const res = await api.get<ApiResponse<Notice[]>>('/notices');
    return extractData(res);
  },

  /** Full board including inactive notices - requires the `notices` write permission. */
  listAll: async (): Promise<Notice[]> => {
    const res = await api.get<ApiResponse<Notice[]>>('/notices/manage');
    return extractData(res);
  },

  create: async (input: CreateNoticeInput): Promise<Notice> => {
    const res = await api.post<ApiResponse<Notice>>('/notices', input);
    return extractData(res);
  },

  update: async (id: number, input: UpdateNoticeInput): Promise<Notice> => {
    const res = await api.patch<ApiResponse<Notice>>(`/notices/${id}`, input);
    return extractData(res);
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/notices/${id}`);
  },
};
