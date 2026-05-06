import { useMutation, useQueryClient } from "@tanstack/react-query";
import { salaryService } from "@/lib/services/salary.service";

export const useSalaryBulkUploadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => salaryService.bulkUpload(formData),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["salary"] });
    },
  });
};
