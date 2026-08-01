import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/lib/services/notification.service';

export const useMarkAllNotificationsReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
