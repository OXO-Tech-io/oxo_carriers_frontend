import api from '@/lib/api';
import type { ApiResponse } from '@/types/api';
import { mapDbUserToAppUser, type DbUserResponse } from '@/lib/mappers/user.mapper';
import type { User } from '@/types';
import type {
  EmployeeEducation,
  EmployeeWorkHistory,
  EmployeePii,
  EmployeeNominee,
  EmployeeDependent,
  EmployeeEmergencyContact,
  EmployeeWelfareInfo,
  ExperienceSummary,
  ProfileChangeRequest,
  ProfileChangeRequestStatus,
  SubmitProfileChangeRequestInput,
} from '@/types/profile';

export interface ListChangeRequestsParams {
  status?: ProfileChangeRequestStatus;
  userId?: number;
}

export const profileService = {
  getMyProfile: async (): Promise<User | null> => {
    const res = await api.get<ApiResponse<DbUserResponse>>('/auth/me');
    return mapDbUserToAppUser(res.data.data);
  },

  getMyEducation: async (): Promise<EmployeeEducation[]> => {
    const res = await api.get<ApiResponse<EmployeeEducation[]>>('/employee-education');
    return res.data.data;
  },

  getEducationForUser: async (userId: number): Promise<EmployeeEducation[]> => {
    const res = await api.get<ApiResponse<EmployeeEducation[]>>('/employee-education', {
      params: { userId },
    });
    return res.data.data;
  },

  getMyWorkHistory: async (): Promise<EmployeeWorkHistory[]> => {
    const res = await api.get<ApiResponse<EmployeeWorkHistory[]>>('/employee-work-history');
    return res.data.data;
  },

  getWorkHistoryForUser: async (userId: number): Promise<EmployeeWorkHistory[]> => {
    const res = await api.get<ApiResponse<EmployeeWorkHistory[]>>('/employee-work-history', {
      params: { userId },
    });
    return res.data.data;
  },

  getEmployeePii: async (userId: number): Promise<EmployeePii | null> => {
    const res = await api.get<{ success: boolean; pii: EmployeePii | null }>(`/employees/${userId}/pii`);
    return res.data.pii;
  },

  // These 4 read-only endpoints are mounted at /employees/:employeeId/... (the
  // employee's string employeeId, not their numeric id) - the backend service
  // branches self-vs-HR access same as education/work-history, but self-role
  // callers always get their own records regardless of which employeeId is
  // in the URL, so passing your own employeeId is always safe.
  getNominees: async (employeeId: string): Promise<EmployeeNominee[]> => {
    const res = await api.get<ApiResponse<EmployeeNominee[]>>(`/employees/${employeeId}/nominees`);
    return res.data.data;
  },

  getDependents: async (employeeId: string): Promise<EmployeeDependent[]> => {
    const res = await api.get<ApiResponse<EmployeeDependent[]>>(`/employees/${employeeId}/dependents`);
    return res.data.data;
  },

  getEmergencyContacts: async (employeeId: string): Promise<EmployeeEmergencyContact[]> => {
    const res = await api.get<ApiResponse<EmployeeEmergencyContact[]>>(`/employees/${employeeId}/emergency-contacts`);
    return res.data.data;
  },

  getWelfareInfo: async (employeeId: string): Promise<EmployeeWelfareInfo | null> => {
    const res = await api.get<ApiResponse<EmployeeWelfareInfo | null>>(`/employees/${employeeId}/welfare-info`);
    return res.data.data;
  },

  getMyExperienceSummary: async (): Promise<ExperienceSummary> => {
    const res = await api.get<ApiResponse<ExperienceSummary>>('/employee-work-history/experience-summary');
    return res.data.data;
  },

  getExperienceSummaryForUser: async (userId: number): Promise<ExperienceSummary> => {
    const res = await api.get<ApiResponse<ExperienceSummary>>('/employee-work-history/experience-summary', {
      params: { userId },
    });
    return res.data.data;
  },

  // GET /profile-change-requests branches server-side on the caller's role:
  // employees get only their own requests, HR gets every employee's requests
  // (optionally filtered by status/userId). Same call, different result set.
  listChangeRequests: async (params: ListChangeRequestsParams = {}): Promise<ProfileChangeRequest[]> => {
    const res = await api.get<ApiResponse<ProfileChangeRequest[]>>('/profile-change-requests', { params });
    return res.data.data;
  },

  getChangeRequestById: async (id: number): Promise<ProfileChangeRequest> => {
    const res = await api.get<ApiResponse<ProfileChangeRequest>>(`/profile-change-requests/${id}`);
    return res.data.data;
  },

  submitChangeRequest: async (input: SubmitProfileChangeRequestInput): Promise<ProfileChangeRequest> => {
    const res = await api.post<ApiResponse<ProfileChangeRequest>>('/profile-change-requests', input);
    return res.data.data;
  },

  approveChangeRequest: async (id: number, reviewerComments?: string): Promise<ProfileChangeRequest> => {
    const res = await api.put<ApiResponse<ProfileChangeRequest>>(`/profile-change-requests/${id}/decision`, {
      decision: 'approved',
      reviewerComments,
    });
    return res.data.data;
  },

  rejectChangeRequest: async (id: number, reviewerComments: string): Promise<ProfileChangeRequest> => {
    const res = await api.put<ApiResponse<ProfileChangeRequest>>(`/profile-change-requests/${id}/decision`, {
      decision: 'rejected',
      reviewerComments,
    });
    return res.data.data;
  },

  returnChangeRequest: async (id: number, reviewerComments: string): Promise<ProfileChangeRequest> => {
    const res = await api.put<ApiResponse<ProfileChangeRequest>>(`/profile-change-requests/${id}/decision`, {
      decision: 'returned_for_modification',
      reviewerComments,
    });
    return res.data.data;
  },
};
