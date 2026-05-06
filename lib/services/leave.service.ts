import api from '@/lib/api';
import type { ApiResponse } from '@/types/api';
import type { LeaveBalance, LeaveRequest, LeaveType } from '@/types';

export interface ListLeaveRequestsParams {
  status?: string;
  department?: string;
  year?: number;
}

export interface ApproveLeaveInput {
  approvedBy: 'team_leader' | 'hr';
  rejectionReason?: string;
}

export interface RejectLeaveInput {
  rejectionReason: string;
}

export const leaveService = {
  getLeaveTypes: async (): Promise<LeaveType[]> => {
    const res = await api.get<ApiResponse<LeaveType[]>>('/leaves/types');
    return res.data.data;
  },

  getLeaveBalance: async (year?: number): Promise<LeaveBalance[]> => {
    const res = await api.get<ApiResponse<LeaveBalance[]>>('/leaves/balance', {
      params: year ? { year } : undefined,
    });
    return res.data.data;
  },

  listLeaveRequests: async (
    params: ListLeaveRequestsParams = {}
  ): Promise<LeaveRequest[]> => {
    const res = await api.get<ApiResponse<LeaveRequest[]>>('/leaves', {
      params,
    });
    return res.data.data;
  },

  getLeaveRequestById: async (id: number): Promise<LeaveRequest> => {
    const res = await api.get<ApiResponse<LeaveRequest>>(`/leaves/${id}`);
    return res.data.data;
  },

  createLeaveRequest: async (formData: FormData): Promise<LeaveRequest> => {
    const res = await api.post<ApiResponse<LeaveRequest>>('/leaves', formData);
    return res.data.data;
  },

  approveLeaveRequest: async (
    id: number,
    input: ApproveLeaveInput
  ): Promise<LeaveRequest> => {
    const res = await api.put<ApiResponse<LeaveRequest>>(
      `/leaves/${id}/approve`,
      input
    );
    return res.data.data;
  },

  rejectLeaveRequest: async (
    id: number,
    input: RejectLeaveInput
  ): Promise<LeaveRequest> => {
    const res = await api.put<ApiResponse<LeaveRequest>>(
      `/leaves/${id}/reject`,
      input
    );
    return res.data.data;
  },
};
