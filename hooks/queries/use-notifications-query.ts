import { useQuery } from '@tanstack/react-query';
import { notificationService, type ListNotificationsParams } from '@/lib/services/notification.service';

export const notificationsQueryKey = (params: ListNotificationsParams = {}) =>
  ['notifications', 'list', params] as const;

export const useNotificationsQuery = (
  params: ListNotificationsParams = {},
  options?: { enabled?: boolean }
) =>
  useQuery({
    queryKey: notificationsQueryKey(params),
    queryFn: () => notificationService.listMine(params),
    enabled: options?.enabled ?? true,
    refetchInterval: 30000,
  });
