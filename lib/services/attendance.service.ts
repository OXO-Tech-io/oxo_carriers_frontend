import api from '@/lib/api';
import { extractData } from '@/lib/services/http';
import type { ApiResponse } from '@/types/api';
import type {
  AttendanceHistoryDay,
  AttendanceHistoryDayForEmployee,
  AttendanceSession,
  TodayAttendance,
} from '@/types/attendance';
import { SessionAction } from '@/types/attendance';

export interface GetAllAttendanceParams {
  from?: string;
  to?: string;
}

export const attendanceService = {
  clockIn: async (employeeId: string): Promise<AttendanceSession> => {
    const res = await api.post<ApiResponse<AttendanceSession>>(
      `/employees/${employeeId}/attendances/session`,
      { action: SessionAction.CLOCK_IN },
    );
    return extractData(res);
  },

  clockOut: async (employeeId: string): Promise<AttendanceSession> => {
    const res = await api.post<ApiResponse<AttendanceSession>>(
      `/employees/${employeeId}/attendances/session`,
      { action: SessionAction.CLOCK_OUT },
    );
    return extractData(res);
  },

  getToday: async (employeeId: string): Promise<TodayAttendance> => {
    const res = await api.get<ApiResponse<TodayAttendance>>(`/employees/${employeeId}/attendances/today`);
    return extractData(res);
  },

  getHistory: async (employeeId: string, limit?: number): Promise<AttendanceHistoryDay[]> => {
    const res = await api.get<ApiResponse<AttendanceHistoryDay[]>>(
      `/employees/${employeeId}/attendances/history`,
      { params: limit ? { limit } : undefined },
    );
    return extractData(res);
  },

  /** Admin/report view - every employee's in/out time and daily hours. */
  getAll: async (params: GetAllAttendanceParams = {}): Promise<AttendanceHistoryDayForEmployee[]> => {
    const res = await api.get<ApiResponse<AttendanceHistoryDayForEmployee[]>>('/employees/attendances', { params });
    return extractData(res);
  },
};
