import api from '@/lib/api';
import { extractData } from '@/lib/services/http';
import type { ApiResponse } from '@/types/api';
import type { LinkedinOverviewRow, LinkedinStatus } from '@/types/profile';

const base = (userId: number) => `/employees/${userId}/linkedin`;

export const linkedinService = {
  overview: async (): Promise<LinkedinOverviewRow[]> =>
    extractData(await api.get<ApiResponse<LinkedinOverviewRow[]>>('/linkedin-sync/overview')),
  syncAll: async (): Promise<{ queued: number }> =>
    extractData(await api.post<ApiResponse<{ queued: number }>>('/linkedin-sync/sync-all')),
  connect: async (userId: number): Promise<LinkedinStatus> =>
    extractData(await api.post<ApiResponse<LinkedinStatus>>(`${base(userId)}/connect`)),
  disconnect: async (userId: number): Promise<LinkedinStatus> =>
    extractData(await api.delete<ApiResponse<LinkedinStatus>>(base(userId))),
  refresh: async (userId: number): Promise<LinkedinStatus> =>
    extractData(await api.post<ApiResponse<LinkedinStatus>>(`${base(userId)}/refresh`)),
};
