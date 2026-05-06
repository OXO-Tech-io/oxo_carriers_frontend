import { useMutation, useQueryClient } from "@tanstack/react-query";
import { medicalInsuranceService } from "@/lib/services/medical-insurance.service";

export const useCreateMedicalInsuranceClaimMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      medicalInsuranceService.createClaim(formData),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["medical-insurance"] });
    },
  });
};

export const useResubmitMedicalInsuranceClaimMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) =>
      medicalInsuranceService.resubmitClaim(id, formData),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["medical-insurance"] });
    },
  });
};

export const useApproveMedicalInsuranceClaimMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => medicalInsuranceService.approveClaim(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["medical-insurance"] });
    },
  });
};

export const useRejectMedicalInsuranceClaimMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      admin_comment,
    }: {
      id: number;
      admin_comment: string;
    }) => medicalInsuranceService.rejectClaim(id, admin_comment),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["medical-insurance"] });
    },
  });
};
