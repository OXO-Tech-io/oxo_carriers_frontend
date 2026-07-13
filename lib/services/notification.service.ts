import api from '@/lib/api';
import type { ApiResponse } from '@/types/api';
import type { AppNotification } from '@/types/profile';

export interface ListNotificationsParams {
  isRead?: boolean;
  limit?: number;
  offset?: number;
}

export const notificationService = {
  listMine: async (params: ListNotificationsParams = {}): Promise<AppNotification[]> => {
    const res = await api.get<ApiResponse<AppNotification[]>>('/notifications', { params });
    return res.data.data;
  },

  unreadCount: async (): Promise<number> => {
    const res = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
    return res.data.data.count;
  },

  markRead: async (id: number): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await api.patch('/notifications/read-all');
  },
};
