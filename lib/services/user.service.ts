import api from "@/lib/api";
import { extractData } from "@/lib/services/http";
import type { User, Vendor } from "@/types";
import type { ApiResponse } from "@/types/api";

export interface ListUsersParams {
  page?: number;
  limit?: number;
  department?: string;
  role?: string;
  search?: string;
}

export interface UsersListResponse {
  users: User[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface VendorsListResponse {
  vendors: Vendor[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface CreateVendorInput {
  company_name: string;
  email: string;
  contact_number?: string;
  bank_name?: string;
  account_holder_name?: string;
  account_number?: string;
  bank_branch?: string;
}

export const userService = {
  listUsers: async (
    params: ListUsersParams = {},
  ): Promise<UsersListResponse> => {
    const res = await api.get<
      ApiResponse<UsersListResponse> | UsersListResponse
    >("/users", { params });
    return extractData<UsersListResponse>(res as never);
  },

  listVendors: async (
    params: ListUsersParams = {},
  ): Promise<VendorsListResponse> => {
    const res = await api.get<
      ApiResponse<VendorsListResponse> | VendorsListResponse
    >("/vendors", { params });
    return extractData<VendorsListResponse>(res as never);
  },

  listDepartments: async (): Promise<string[]> => {
    const res = await api.get<ApiResponse<string[]> | string[]>(
      "/users/departments",
    );
    return extractData<string[]>(res as never);
  },

  createUser: async (formData: FormData): Promise<User> => {
    const res = await api.post<ApiResponse<User> | User>("/users", formData);
    return extractData<User>(res as never);
  },

  createVendor: async (payload: CreateVendorInput): Promise<Vendor> => {
    const res = await api.post<ApiResponse<Vendor> | Vendor>(
      "/vendors",
      payload,
    );
    return extractData<Vendor>(res as never);
  },

  resetUserPassword: async (
    userId: number,
  ): Promise<{ message?: string; success?: boolean }> => {
    const res = await api.post<{ message?: string; success?: boolean }>(
      `/users/${userId}/reset-password`,
    );
    return res.data;
  },

  deleteUser: async (userId: number): Promise<void> => {
    await api.delete(`/users/${userId}`);
  },

  updateUserRole: async (userId: number, role: string): Promise<void> => {
    await api.patch(`/users/${userId}/role`, { role });
  },
};
