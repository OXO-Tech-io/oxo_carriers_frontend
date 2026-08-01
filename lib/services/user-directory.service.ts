import api from '@/lib/api';
import type { EmployeeSummary } from '@/types/hrModules';
import { mapDbUserToAppUser, type DbUserResponse } from '@/lib/mappers/user.mapper';

export interface ListEmployeesParams {
  search?: string;
  role?: string;
  department?: string;
}

// GET /users predates the { success, message, data } response convention -
// it returns { success, users } directly, so this bypasses extractData().
// Each row is driven by the local employee table, cross-referenced against
// Keycloak status where available (see backend users.service.ts#getAll) -
// the employee fields live under `employee`, not at the top level. `employee`
// should always be present now, but the filter below stays as a defensive
// no-op in case a future backend change reintroduces a gap.
interface KeycloakUserRow {
  employee: DbUserResponse | null;
}

export const userDirectoryService = {
  list: async (params: ListEmployeesParams = {}): Promise<EmployeeSummary[]> => {
    const res = await api.get<{ success: boolean; users: KeycloakUserRow[] }>('/users', { params });
    return (res.data.users ?? [])
      .filter((row) => row.employee)
      .map((row) => {
        const user = mapDbUserToAppUser(row.employee)!;
        return {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          employee_id: user.employee_id,
          department: user.department,
          role: user.role,
        };
      });
  },
};
