import api from '@/lib/api';
import { extractData } from '@/lib/services/http';
import type { ApiResponse } from '@/types/api';
import type { ArchivedEmployee } from '@/types/archive';

// OCD-453: read-only Archive of deleted employee profiles - permission-gated
// server-side on the `archive` key (Administrator/HR Manager by default).
export const archiveService = {
  listAll: async (): Promise<ArchivedEmployee[]> => {
    const res = await api.get<ApiResponse<ArchivedEmployee[]>>('/archives');
    return extractData(res);
  },

  getById: async (id: number): Promise<ArchivedEmployee> => {
    const res = await api.get<ApiResponse<ArchivedEmployee>>(`/archives/${id}`);
    return extractData(res);
  },
};
