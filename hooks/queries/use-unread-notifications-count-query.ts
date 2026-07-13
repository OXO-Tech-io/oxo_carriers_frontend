import { useQuery } from '@tanstack/react-query';
import { notificationService } from '@/lib/services/notification.service';

export const unreadNotificationsCountQueryKey = () => ['notifications', 'unread-count'] as const;

export const useUnreadNotificationsCountQuery = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: unreadNotificationsCountQueryKey(),
    queryFn: () => notificationService.unreadCount(),
    enabled: options?.enabled ?? true,
    refetchInterval: 30000,
  });
