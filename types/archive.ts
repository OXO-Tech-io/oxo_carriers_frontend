// OCD-453: Archive of deleted employee profiles. Mirrors the backend's raw
// camelCase JSON shape directly (ArchiveService/EmployeeArchiveModel) - no
// mapper needed, same convention as types/profile.ts and types/hrModules.ts.

export interface ArchivedEmployeeSnapshot {
  employee: Record<string, unknown> & {
    id: number;
    employeeId: string | null;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    department?: string | null;
    position?: string | null;
  };
  personalDetails: Record<string, unknown> | null;
  nominees: Record<string, unknown>[];
  dependents: Record<string, unknown>[];
  emergencyContacts: Record<string, unknown>[];
  welfareInfo: Record<string, unknown> | null;
  education: Record<string, unknown>[];
  workHistory: Record<string, unknown>[];
}

export interface ArchivedEmployee {
  id: number;
  employeeId: string;
  employeeNumericId: number | null;
  snapshot: ArchivedEmployeeSnapshot;
  deletedAt: string;
  deletedByEmployeeId: number | null;
  deletedByName: string | null;
  createdAt: string;
}
