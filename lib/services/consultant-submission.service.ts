import api from "@/lib/api";
import { extractData } from "@/lib/services/http";
import type { ConsultantWorkSubmission } from "@/types";
import type { ApiResponse } from "@/types/api";

export interface ConsultantSubmissionFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface ConsultantSubmissionListResponse {
  submissions: ConsultantWorkSubmission[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export const consultantSubmissionService = {
  listSubmissions: async (
    filters: ConsultantSubmissionFilters = {},
  ): Promise<ConsultantSubmissionListResponse> => {
    const res = await api.get<
      | ApiResponse<ConsultantSubmissionListResponse>
      | ConsultantSubmissionListResponse
    >("/consultant-submissions", { params: filters });
    return extractData<ConsultantSubmissionListResponse>(res as never);
  },

  createSubmission: async (
    formData: FormData,
  ): Promise<ConsultantWorkSubmission> => {
    const res = await api.post<
      ApiResponse<ConsultantWorkSubmission> | ConsultantWorkSubmission
    >("/consultant-submissions", formData);
    return extractData<ConsultantWorkSubmission>(res as never);
  },

  resubmitSubmission: async (
    id: number,
    formData: FormData,
  ): Promise<ConsultantWorkSubmission> => {
    const res = await api.post<
      ApiResponse<ConsultantWorkSubmission> | ConsultantWorkSubmission
    >(`/consultant-submissions/${id}/resubmit`, formData);
    return extractData<ConsultantWorkSubmission>(res as never);
  },

  approveSubmission: async (id: number): Promise<ConsultantWorkSubmission> => {
    const res = await api.put<
      ApiResponse<ConsultantWorkSubmission> | ConsultantWorkSubmission
    >(`/consultant-submissions/${id}/approve`);
    return extractData<ConsultantWorkSubmission>(res as never);
  },

  rejectSubmission: async (
    id: number,
    admin_comment: string,
  ): Promise<ConsultantWorkSubmission> => {
    const res = await api.put<
      ApiResponse<ConsultantWorkSubmission> | ConsultantWorkSubmission
    >(`/consultant-submissions/${id}/reject`, { admin_comment });
    return extractData<ConsultantWorkSubmission>(res as never);
  },
};
