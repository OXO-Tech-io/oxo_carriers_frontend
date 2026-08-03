import { useMutation, useQueryClient } from '@tanstack/react-query';
import { workLogService } from '@/lib/services/work-log.service';
import type { WorkLogDeadlineSettingsUpdate, WorkLogEntryDraft } from '@/types/hrModules';

export const useSubmitWorkLogMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entries: WorkLogEntryDraft[]) => workLogService.submit(entries),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['work-logs', 'mine'] });
    },
  });
};

export const useUpdateWorkLogDeadlineMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: WorkLogDeadlineSettingsUpdate) => workLogService.updateDeadline(updates),
    onSuccess: () => {
      // Refresh the deadline banner/card. Already-submitted rows keep the
      // is_late they were stamped with - a deadline change is not retroactive.
      void queryClient.invalidateQueries({ queryKey: ['work-logs', 'deadline'] });
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
