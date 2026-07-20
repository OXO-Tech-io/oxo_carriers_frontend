import api from '@/lib/api';
import type { EmployeeSummary } from '@/types/hrModules';

export interface ListEmployeesParams {
  search?: string;
  role?: string;
  department?: string;
}

// GET /users predates the { success, message, data } response convention -
// it returns { success, users } directly, so this bypasses extractData().
export const userDirectoryService = {
  list: async (params: ListEmployeesParams = {}): Promise<EmployeeSummary[]> => {
    const res = await api.get<{ success: boolean; users: EmployeeSummary[] }>('/users', { params });
    return res.data.users ?? [];
  },
};
