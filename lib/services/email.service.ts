import api from "@/lib/api";

export interface EmailConfigCheckResponse {
  success: boolean;
  message?: string;
  [key: string]: unknown;
}

export interface TestEmailInput {
  email: string;
  subject?: string;
  message?: string;
}

export interface TestEmailResponse {
  success: boolean;
  message?: string;
  [key: string]: unknown;
}

export const emailService = {
  checkConfig: async (): Promise<EmailConfigCheckResponse> => {
    const res = await api.get<EmailConfigCheckResponse>("/health/email-config");
    return res.data;
  },

  sendTestEmail: async (
    payload: TestEmailInput,
  ): Promise<TestEmailResponse> => {
    const res = await api.post<TestEmailResponse>("/health/email-tests", payload);
    return res.data;
  },
};
