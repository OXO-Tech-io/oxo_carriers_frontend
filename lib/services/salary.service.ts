import api from "@/lib/api";
import { extractData } from "@/lib/services/http";
import type { ApiResponse } from "@/types/api";
import type { SalarySlip } from "@/types";

export interface SalaryListResponse {
  salaries: SalarySlip[];
}

export interface SalaryYtd {
  year: number;
  total_earnings: number;
  total_deductions: number;
  net_salary: number;
}

export const salaryService = {
  bulkUpload: async (
    formData: FormData,
  ): Promise<{ message?: string; success?: boolean }> => {
    const res = await api.post<{ message?: string; success?: boolean }>(
      "/salaries/bulk-uploads",
      formData,
    );
    return res.data;
  },

  listSalaries: async (year?: number): Promise<SalaryListResponse> => {
    const res = await api.get<
      ApiResponse<SalaryListResponse> | SalaryListResponse
    >("/salaries", {
      params: year ? { year } : undefined,
    });
    return extractData<SalaryListResponse>(res as never);
  },

  getSalaryById: async (id: number): Promise<SalarySlip> => {
    const res = await api.get<ApiResponse<SalarySlip> | SalarySlip>(
      `/salaries/${id}`,
    );
    return extractData<SalarySlip>(res as never);
  },

  getSalaryYtd: async (year: number): Promise<SalaryYtd> => {
    const res = await api.get<ApiResponse<SalaryYtd> | SalaryYtd>(
      "/salaries/ytd",
      {
        params: { year },
      },
    );
    return extractData<SalaryYtd>(res as never);
  },

  downloadSalaryPdf: async (salaryId: number): Promise<Blob> => {
    const res = await api.get<Blob>(`/salaries/${salaryId}/pdf`, {
      responseType: "blob",
    });
    return res.data;
  },
};
