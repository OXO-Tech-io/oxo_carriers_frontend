import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  authService,
  type LoginInput,
  type RegisterInput,
} from "@/lib/services/auth.service";

export const useLoginMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => authService.login(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
};

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
