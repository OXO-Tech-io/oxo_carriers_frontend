import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  userService,
  type CreateVendorInput,
} from "@/lib/services/user.service";

export const useCreateUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => userService.createUser(formData),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useCreateVendorMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateVendorInput) =>
      userService.createVendor(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
};

export const useResetUserPasswordMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => userService.resetUserPassword(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => userService.deleteUser(userId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useUpdateUserRoleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: string }) =>
      userService.updateUserRole(userId, role),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};
