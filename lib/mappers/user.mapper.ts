import type { User, UserTitle } from '@/types';

// The backend's GET /auth/me returns the raw Drizzle `users` row - camelCase
// fields (firstName, employeeId, hireDate, contactNumber, ...). The frontend
// `User` type is snake_case. Previously `AuthHydrator` (app/providers.tsx)
// passed the response straight into the auth store with no mapping, so every
// consumer reading e.g. `user.first_name` silently got `undefined`. This maps
// the raw backend shape into the frontend's `User` shape.
export interface DbUserResponse {
  id: number;
  employeeId?: string | null;
  email: string;
  title?: UserTitle | null;
  firstName: string;
  lastName: string;
  role: string;
  department?: string | null;
  position?: string | null;
  hireDate?: string | null;
  managerId?: number | null;
  hourlyRate?: number | string | null;
  bankName?: string | null;
  accountHolderName?: string | null;
  accountNumber?: string | null;
  bankBranch?: string | null;
  companyName?: string | null;
  contactNumber?: string | null;
  undergraduateDegreeCompletionDate?: string | null;
  createdAt?: string | null;
}

export function mapDbUserToAppUser(raw: DbUserResponse | null | undefined): User | null {
  if (!raw) return null;

  return {
    id: raw.id,
    employee_id: raw.employeeId ?? '',
    email: raw.email,
    title: raw.title ?? null,
    first_name: raw.firstName,
    last_name: raw.lastName,
    role: raw.role as User['role'],
    department: raw.department ?? '',
    position: raw.position ?? '',
    hire_date: raw.hireDate ?? '',
    manager_id: raw.managerId ?? undefined,
    hourly_rate: raw.hourlyRate !== null && raw.hourlyRate !== undefined ? Number(raw.hourlyRate) : null,
    created_at: raw.createdAt ?? '',
    contact_number: raw.contactNumber ?? null,
    bank_name: raw.bankName ?? null,
    account_holder_name: raw.accountHolderName ?? null,
    account_number: raw.accountNumber ?? null,
    bank_branch: raw.bankBranch ?? null,
    company_name: raw.companyName ?? null,
    undergraduate_degree_completion_date: raw.undergraduateDegreeCompletionDate ?? null,
  };
}
