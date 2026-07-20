import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/lib/services/notification.service';

export const useMarkNotificationReadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => notificationService.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
