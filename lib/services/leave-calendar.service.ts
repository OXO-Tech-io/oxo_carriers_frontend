import api from '@/lib/api';
import type { ApiResponse } from '@/types/api';

export interface Holiday {
  id: number;
  date: string;
  name: string;
  description?: string;
  is_recurring: boolean;
  year?: number;
}

export const leaveCalendarService = {
  getHolidaysInRange: async (
    startDate: string,
    endDate: string
  ): Promise<Holiday[]> => {
    const res = await api.get<ApiResponse<Holiday[]>>(
      '/leave-calendar/range',
      { params: { startDate, endDate } }
    );
    return res.data.data ?? [];
  },
};
