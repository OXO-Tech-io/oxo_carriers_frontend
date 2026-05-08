import api from "@/lib/api";
import { extractData } from "@/lib/services/http";
import type { User } from "@/types";
import type { ApiResponse } from "@/types/api";
import { passwordLogin } from "@/lib/keycloakAuth";

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  first_name: string;
  last_name: string;
  email: string;
  employee_id: string;
  position: string;
  department: string;
  hire_date: string;
  role?: string;
  password?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  mustChangePassword?: boolean;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://backend.oxocareers.com/api"
    : "http://localhost:5000/api");

export const authService = {
  login: async (input: LoginInput): Promise<LoginResponse> => {
    const tokens = await passwordLogin(input.email, input.password);
    const meRes = await api.get<
      ApiResponse<User> | { success?: boolean; user?: User }
    >("/auth/me", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
      // Avoid stale auth from interceptors by using explicit URL + header here.
      baseURL: API_URL,
    });

    const body = meRes.data;
    const user =
      typeof body === "object" && body !== null && "user" in body
        ? (body as { user: User }).user
        : extractData<User>(meRes as never);

    return {
      token: tokens.access_token,
      user,
    };
  },

  getCurrentUser: async (): Promise<User> => {
    const res = await api.get<
      ApiResponse<User> | { success?: boolean; user?: User }
    >("/auth/me");
    const body = res.data;

    if (typeof body === "object" && body !== null && "user" in body) {
      return (body as { user: User }).user;
    }

    return extractData<User>(res as never);
  },

  register: async (
    input: RegisterInput,
  ): Promise<{ message?: string; success?: boolean }> => {
    const res = await api.post<{ message?: string; success?: boolean }>(
      "/auth/register",
      input,
    );
    return res.data;
  },

  verifyEmail: async (
    token: string,
  ): Promise<{ message?: string; success?: boolean }> => {
    const res = await api.get<{ message?: string; success?: boolean }>(
      `/auth/verify-email?token=${token}`,
    );
    return res.data;
  },

  resetPassword: async (
    token: string,
    password: string,
  ): Promise<{ message?: string; success?: boolean }> => {
    const res = await api.post<{ message?: string; success?: boolean }>(
      "/auth/reset-password",
      {
        token,
        password,
      },
    );
    return res.data;
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string,
  ): Promise<{ message?: string; success?: boolean }> => {
    const res = await api.post<{ message?: string; success?: boolean }>(
      "/auth/change-password",
      {
        currentPassword,
        newPassword,
      },
    );
    return res.data;
  },
};
