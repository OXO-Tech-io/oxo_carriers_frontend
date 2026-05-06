import { useMutation, useQueryClient } from "@tanstack/react-query";
import { consultantSubmissionService } from "@/lib/services/consultant-submission.service";

export const useCreateConsultantSubmissionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      consultantSubmissionService.createSubmission(formData),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["consultant-submissions"],
      });
    },
  });
};

export const useResubmitConsultantSubmissionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, formData }: { id: number; formData: FormData }) =>
      consultantSubmissionService.resubmitSubmission(id, formData),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["consultant-submissions"],
      });
    },
  });
};

export const useApproveConsultantSubmissionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      consultantSubmissionService.approveSubmission(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["consultant-submissions"],
      });
    },
  });
};

export const useRejectConsultantSubmissionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      admin_comment,
    }: {
      id: number;
      admin_comment: string;
    }) => consultantSubmissionService.rejectSubmission(id, admin_comment),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["consultant-submissions"],
      });
    },
  });
};
