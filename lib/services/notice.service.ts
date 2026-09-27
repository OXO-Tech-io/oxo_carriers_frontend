import api from '@/lib/api';
import { extractData } from '@/lib/services/http';
import type { ApiResponse } from '@/types/api';
import type { Notice } from '@/types/hrModules';

export interface CreateNoticeInput {
  title: string;
  message: string;
  isActive?: boolean;
  image?: File | null;
  /** ISO timestamp - when the notice becomes eligible to display. Required. */
  startAt: string;
  /** ISO timestamp - when the notice stops being eligible to display. Required. */
  endAt: string;
}

export type UpdateNoticeInput = Partial<CreateNoticeInput> & { removeImage?: boolean };

const toFormData = (input: CreateNoticeInput | UpdateNoticeInput): FormData => {
  const formData = new FormData();
  if (input.title !== undefined) formData.append('title', input.title);
  if (input.message !== undefined) formData.append('message', input.message);
  if (input.isActive !== undefined) formData.append('isActive', String(input.isActive));
  if (input.startAt !== undefined) formData.append('startAt', input.startAt);
  // Required on create; on update, omitting it (undefined) means "leave it unchanged".
  if ('endAt' in input) formData.append('endAt', input.endAt ?? '');
  if ('removeImage' in input && input.removeImage) formData.append('removeImage', 'true');
  if (input.image) formData.append('image', input.image);
  return formData;
};

export const noticeService = {
  /** Active notices only - what every employee/system user sees on their dashboard. */
  list: async (): Promise<Notice[]> => {
    const res = await api.get<ApiResponse<Notice[]>>('/notices', { params: { status: 'active' } });
    return extractData(res);
  },

  /** Full board including inactive notices - requires the `notices` write permission. */
  listAll: async (): Promise<Notice[]> => {
    const res = await api.get<ApiResponse<Notice[]>>('/notices');
    return extractData(res);
  },

  create: async (input: CreateNoticeInput): Promise<Notice> => {
    const res = await api.post<ApiResponse<Notice>>('/notices', toFormData(input), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return extractData(res);
  },

  update: async (id: number, input: UpdateNoticeInput): Promise<Notice> => {
    const res = await api.patch<ApiResponse<Notice>>(`/notices/${id}`, toFormData(input), {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return extractData(res);
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/notices/${id}`);
  },
};
