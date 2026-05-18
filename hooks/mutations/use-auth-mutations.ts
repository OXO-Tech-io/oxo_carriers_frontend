import { useMutation } from "@tanstack/react-query";
import {
  authService,
  type RegisterInput,
} from "@/lib/services/auth.service";

export const useRegisterMutation = () =>
  useMutation({
    mutationFn: (input: RegisterInput) => authService.register(input),
  });

export const useVerifyEmailMutation = () =>
  useMutation({
    mutationFn: (token: string) => authService.verifyEmail(token),
  });

export const useResetPasswordMutation = () =>
  useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authService.resetPassword(token, password),
  });

export const useChangePasswordMutation = () =>
  useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => authService.changePassword(currentPassword, newPassword),
  });
