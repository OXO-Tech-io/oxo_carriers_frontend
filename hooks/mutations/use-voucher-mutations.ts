import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  voucherService,
  type CreateVoucherInput,
  type ReviewVoucherInput,
} from "@/lib/services/voucher.service";

export const useCreateVoucherMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateVoucherInput) =>
      voucherService.createVoucher(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["vouchers"] });
    },
  });
};

export const useReviewVoucherMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ReviewVoucherInput;
    }) => voucherService.reviewVoucher(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["vouchers"] });
    },
  });
};

export const useResubmitVoucherMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => voucherService.resubmitVoucher(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["vouchers"] });
    },
  });
};

export const useMarkVoucherBankUploadedMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => voucherService.markVoucherBankUploaded(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["vouchers"] });
    },
  });
};

export const useMarkVoucherPaidMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => voucherService.markVoucherPaid(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["vouchers"] });
    },
  });
};
