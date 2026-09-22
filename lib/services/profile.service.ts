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

  // PII now rides along on GET /users/:id (the personal-details route was folded into it).
  getEmployeePersonalDetails: async (userId: number): Promise<EmployeePii | null> => {
    const res = await api.get<{ success: boolean; personalDetails: EmployeePii | null }>(`/users/${userId}`);
    return res.data.personalDetails;
  },

  // These 4 read-only endpoints are mounted at /employees/:employeeUserId/...
  // (the employee's numeric id, not their string employeeId) - the backend
  // service branches self-vs-HR access same as education/work-history, but
  // self-role callers always get their own records regardless of which
  // employeeUserId is in the URL, so passing your own id is always safe.
  getNominees: async (employeeUserId: number): Promise<EmployeeNominee[]> => {
    const res = await api.get<ApiResponse<EmployeeNominee[]>>(`/employees/${employeeUserId}/nominees`);
    return res.data.data;
  },

  getDependents: async (employeeUserId: number): Promise<EmployeeDependent[]> => {
    const res = await api.get<ApiResponse<EmployeeDependent[]>>(`/employees/${employeeUserId}/dependents`);
    return res.data.data;
  },

  getEmergencyContacts: async (employeeUserId: number): Promise<EmployeeEmergencyContact[]> => {
    const res = await api.get<ApiResponse<EmployeeEmergencyContact[]>>(`/employees/${employeeUserId}/emergency-contacts`);
    return res.data.data;
  },

  getWelfareInfo: async (employeeUserId: number): Promise<EmployeeWelfareInfo | null> => {
    const res = await api.get<ApiResponse<EmployeeWelfareInfo | null>>(`/employees/${employeeUserId}/welfare-informations`);
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

  // OCD-478: sent as multipart/form-data (so supporting documents can ride
  // along) whenever files are attached; otherwise stays a plain JSON POST,
  // same as before.
  submitChangeRequest: async (input: SubmitProfileChangeRequestInput): Promise<ProfileChangeRequest> => {
    const { files, ...rest } = input;
    if (!files || files.length === 0) {
      const res = await api.post<ApiResponse<ProfileChangeRequest>>('/profile-change-requests', rest);
      return res.data.data;
    }
    const formData = new FormData();
    formData.append('changes', JSON.stringify(rest.changes));
    if (rest.comments) formData.append('comments', rest.comments);
    if (rest.previousRequestId !== undefined) formData.append('previousRequestId', String(rest.previousRequestId));
    files.forEach((file) => formData.append('documents', file));
    const res = await api.post<ApiResponse<ProfileChangeRequest>>('/profile-change-requests', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  // OCD-454: uploads the "My Profile" camera-icon picture and returns the
  // updated user row (with the new profilePictureUrl already set).
  uploadProfilePicture: async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    const res = await api.post<{ success: boolean; user: DbUserResponse }>('/users/me/profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapDbUserToAppUser(res.data.user) as User;
  },

  approveChangeRequest: async (id: number, reviewerComments?: string): Promise<ProfileChangeRequest> => {
    const res = await api.put<ApiResponse<ProfileChangeRequest>>(`/profile-change-requests/${id}/decisions`, {
      decision: 'approved',
      reviewerComments,
    });
    return res.data.data;
  },

  rejectChangeRequest: async (id: number, reviewerComments: string): Promise<ProfileChangeRequest> => {
    const res = await api.put<ApiResponse<ProfileChangeRequest>>(`/profile-change-requests/${id}/decisions`, {
      decision: 'rejected',
      reviewerComments,
    });
    return res.data.data;
  },

  returnChangeRequest: async (id: number, reviewerComments: string): Promise<ProfileChangeRequest> => {
    const res = await api.put<ApiResponse<ProfileChangeRequest>>(`/profile-change-requests/${id}/decisions`, {
      decision: 'returned_for_modification',
      reviewerComments,
    });
    return res.data.data;
  },
};
