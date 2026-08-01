import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workLogService } from '@/lib/services/work-log.service';
import type { WorkLogEntryDraft } from '@/types/hrModules';

export const useSubmitWorkLogMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entries: WorkLogEntryDraft[]) => workLogService.submit(entries),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['work-logs', 'mine'] });
    },
  });
};

export const useBulkUploadWorkLogMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => workLogService.bulkUpload(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['work-logs', 'mine'] });
    },
  });
};
