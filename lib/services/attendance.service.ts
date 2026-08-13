import api from '@/lib/api';
import { extractData } from '@/lib/services/http';
import type { ApiResponse } from '@/types/api';
import type {
  AttendanceHistoryDay,
  AttendanceHistoryDayForEmployee,
  AttendanceSession,
  TodayAttendance,
} from '@/types/attendance';

export interface GetAllAttendanceParams {
  from?: string;
  to?: string;
}

export const attendanceService = {
  clockIn: async (): Promise<AttendanceSession> => {
    const res = await api.post<ApiResponse<AttendanceSession>>('/attendance/session/start');
    return extractData(res);
  },

  clockOut: async (): Promise<AttendanceSession> => {
    const res = await api.post<ApiResponse<AttendanceSession>>('/attendance/session/end');
    return extractData(res);
  },

  getToday: async (): Promise<TodayAttendance> => {
    const res = await api.get<ApiResponse<TodayAttendance>>('/attendance/me/today');
    return extractData(res);
  },

  getHistory: async (limit?: number): Promise<AttendanceHistoryDay[]> => {
    const res = await api.get<ApiResponse<AttendanceHistoryDay[]>>('/attendance/me/history', {
      params: limit ? { limit } : undefined,
    });
    return extractData(res);
  },

  /** Admin/report view - every employee's in/out time and daily hours. */
  getAll: async (params: GetAllAttendanceParams = {}): Promise<AttendanceHistoryDayForEmployee[]> => {
    const res = await api.get<ApiResponse<AttendanceHistoryDayForEmployee[]>>('/attendance', { params });
    return extractData(res);
  },
};
