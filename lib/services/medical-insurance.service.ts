import api from "@/lib/api";
import { extractData } from "@/lib/services/http";
import type { ApiResponse } from "@/types/api";

export interface MedicalInsuranceClaim {
  id: number;
  status: string;
  admin_comment?: string | null;
  [key: string]: unknown;
}

export interface MedicalInsuranceFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface MedicalInsuranceListResponse {
  claims: MedicalInsuranceClaim[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface MedicalInsuranceLimits {
  annual_limit: number;
  used_amount: number;
  remaining_amount: number;
}

export const medicalInsuranceService = {
  listClaims: async (
    filters: MedicalInsuranceFilters = {},
  ): Promise<MedicalInsuranceListResponse> => {
    const res = await api.get<
      ApiResponse<MedicalInsuranceListResponse> | MedicalInsuranceListResponse
    >("/medical-insurance", {
      params: filters,
    });
    return extractData<MedicalInsuranceListResponse>(res as never);
  },

  getLimits: async (): Promise<MedicalInsuranceLimits> => {
    const res = await api.get<
      ApiResponse<MedicalInsuranceLimits> | MedicalInsuranceLimits
    >("/medical-insurance/limits");
    return extractData<MedicalInsuranceLimits>(res as never);
  },

  createClaim: async (formData: FormData): Promise<MedicalInsuranceClaim> => {
    const res = await api.post<
      ApiResponse<MedicalInsuranceClaim> | MedicalInsuranceClaim
    >("/medical-insurance", formData);
    return extractData<MedicalInsuranceClaim>(res as never);
  },

  resubmitClaim: async (
    id: number,
    formData: FormData,
  ): Promise<MedicalInsuranceClaim> => {
    const res = await api.post<
      ApiResponse<MedicalInsuranceClaim> | MedicalInsuranceClaim
    >(`/medical-insurance/${id}/resubmit`, formData);
    return extractData<MedicalInsuranceClaim>(res as never);
  },

  approveClaim: async (id: number): Promise<MedicalInsuranceClaim> => {
    const res = await api.put<
      ApiResponse<MedicalInsuranceClaim> | MedicalInsuranceClaim
    >(`/medical-insurance/${id}/approve`);
    return extractData<MedicalInsuranceClaim>(res as never);
  },

  rejectClaim: async (
    id: number,
    admin_comment: string,
  ): Promise<MedicalInsuranceClaim> => {
    const res = await api.put<
      ApiResponse<MedicalInsuranceClaim> | MedicalInsuranceClaim
    >(`/medical-insurance/${id}/reject`, {
      admin_comment,
    });
    return extractData<MedicalInsuranceClaim>(res as never);
  },
};
