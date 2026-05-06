import api from "@/lib/api";
import { extractData } from "@/lib/services/http";
import type { ApiResponse } from "@/types/api";
import type { PaymentVoucher } from "@/types";

export interface VoucherFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export interface VoucherListResponse {
  vouchers: PaymentVoucher[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ServiceProviderOption {
  id: number;
  company_name: string;
  email: string;
}

export interface CreateVoucherInput {
  vendor_id: number;
  amount: number;
  vat?: number;
  description?: string;
  invoice_url?: string;
}

export interface ReviewVoucherInput {
  action: "approve" | "reject" | "information_request";
  comment?: string;
}

export const voucherService = {
  listVouchers: async (
    filters: VoucherFilters = {},
  ): Promise<VoucherListResponse> => {
    const res = await api.get<
      ApiResponse<VoucherListResponse> | VoucherListResponse
    >("/vouchers", { params: filters });
    return extractData<VoucherListResponse>(res as never);
  },

  listServiceProviders: async (): Promise<ServiceProviderOption[]> => {
    const res = await api.get<
      ApiResponse<ServiceProviderOption[]> | ServiceProviderOption[]
    >("/vouchers/service-providers");
    return extractData<ServiceProviderOption[]>(res as never);
  },

  createVoucher: async (
    payload: CreateVoucherInput,
  ): Promise<PaymentVoucher> => {
    const res = await api.post<ApiResponse<PaymentVoucher> | PaymentVoucher>(
      "/vouchers",
      payload,
    );
    return extractData<PaymentVoucher>(res as never);
  },

  reviewVoucher: async (
    id: number,
    payload: ReviewVoucherInput,
  ): Promise<PaymentVoucher> => {
    const res = await api.put<ApiResponse<PaymentVoucher> | PaymentVoucher>(
      `/vouchers/${id}/review`,
      payload,
    );
    return extractData<PaymentVoucher>(res as never);
  },

  resubmitVoucher: async (id: number): Promise<PaymentVoucher> => {
    const res = await api.put<ApiResponse<PaymentVoucher> | PaymentVoucher>(
      `/vouchers/${id}/resubmit`,
    );
    return extractData<PaymentVoucher>(res as never);
  },

  markVoucherBankUploaded: async (id: number): Promise<PaymentVoucher> => {
    const res = await api.put<ApiResponse<PaymentVoucher> | PaymentVoucher>(
      `/vouchers/${id}/bank-upload`,
    );
    return extractData<PaymentVoucher>(res as never);
  },

  markVoucherPaid: async (id: number): Promise<PaymentVoucher> => {
    const res = await api.put<ApiResponse<PaymentVoucher> | PaymentVoucher>(
      `/vouchers/${id}/paid`,
    );
    return extractData<PaymentVoucher>(res as never);
  },
};
