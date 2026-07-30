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

export interface SubmissionBreakdownParams {
  department?: string;
  employeeId?: string;
  formId?: number;
  communicationId?: number;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface FormBreakdownItem {
  distributionId: number;
  formId: number;
  formTitle: string;
  employeeId: string;
  employeeName: string;
  department: string;
  distributedAt: string;
  deadlineAt: string | null;
  submittedAt: string | null;
  status: 'on_time' | 'late' | 'overdue' | 'pending';
  completionMs: number | null;
}

export interface CommunicationBreakdownItem {
  recipientId: number;
  communicationId: number;
  communicationTitle: string;
  employeeId: string;
  employeeName: string;
  department: string;
  emailSentAt: string | null;
  deadlineAt: string | null;
  respondedAt: string | null;
  responseText: string | null;
  status: 'on_time' | 'late' | 'overdue' | 'pending';
}

export interface UserComplianceItem {
  employeeId: string;
  employeeName: string;
  department: string;
  forms: { total: number; onTime: number; late: number; overdue: number; pending: number };
  communications: { total: number; onTime: number; late: number; overdue: number; pending: number };
  complianceRate: number;
}

export interface SubmissionFilterOptions {
  employees: Array<{ employeeId: string; employeeName: string; department: string }>;
  forms: Array<{ id: number; title: string }>;
  communications: Array<{ id: number; title: string }>;
  departments: string[];
}

export interface SubmissionBreakdownData {
  success: boolean;
  summary: {
    forms: {
      totalAssigned: number;
      onTimeCount: number;
      lateCount: number;
      overdueCount: number;
      pendingCount: number;
      onTimePercentage: number;
    };
    communications: {
      totalRecipients: number;
      onTimeCount: number;
      lateCount: number;
      overdueCount: number;
      pendingCount: number;
      onTimePercentage: number;
    };
    overallComplianceRate: number;
  };
  filterOptions?: SubmissionFilterOptions;
  formsBreakdown: FormBreakdownItem[];
  communicationsBreakdown: CommunicationBreakdownItem[];
  userBreakdown: UserComplianceItem[];
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

  getSubmissionsBreakdown: async (params: SubmissionBreakdownParams): Promise<SubmissionBreakdownData> => {
    const res = await api.get<SubmissionBreakdownData>("/reports/submissions-breakdown", { params });
    return res.data;
  },

  downloadSubmissionsBreakdownExcel: async (params: SubmissionBreakdownParams): Promise<Blob> => {
    const res = await api.get<Blob>("/reports/submissions-breakdown", {
      params: { ...params, format: 'excel' },
      responseType: "blob",
    });
    return res.data;
  },
};

