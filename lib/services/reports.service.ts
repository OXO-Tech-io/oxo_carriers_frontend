import api from "@/lib/api";

export interface LeaveReportParams {
  year?: number;
  status?: string;
  department?: string;
}

export interface SalaryReportParams {
  year?: number;
  department?: string;
}

export interface DashboardSummary {
  [key: string]: unknown;
}

export const reportsService = {
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const res = await api.get<DashboardSummary>("/reports/dashboard");
    return res.data;
  },

  downloadLeavesReport: async (params: LeaveReportParams): Promise<Blob> => {
    const res = await api.get<Blob>("/reports/leaves", {
      params,
      responseType: "blob",
    });
    return res.data;
  },

  downloadSalariesReport: async (params: SalaryReportParams): Promise<Blob> => {
    const res = await api.get<Blob>("/reports/salaries", {
      params,
      responseType: "blob",
    });
    return res.data;
  },
};
