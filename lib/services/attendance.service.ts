import api from '@/lib/api';
import { extractData } from '@/lib/services/http';
import type { ApiResponse } from '@/types/api';
import type { AttendanceHistoryDay, AttendanceHistoryDayForEmployee, AttendanceSession, BreakLog } from '@/types/attendance';
import { SessionAction } from '@/types/attendance';

export interface GetAttendanceParams {
  from?: string;
  to?: string;
}

export const attendanceService = {
  clockIn: async (employeeId: string): Promise<AttendanceSession> => {
    const res = await api.post<ApiResponse<AttendanceSession>>(
      `/employees/${employeeId}/attendances`,
      { action: SessionAction.CLOCK_IN },
    );
    return extractData(res);
  },

  clockOut: async (employeeId: string): Promise<AttendanceSession> => {
    const res = await api.post<ApiResponse<AttendanceSession>>(
      `/employees/${employeeId}/attendances`,
      { action: SessionAction.CLOCK_OUT },
    );
    return extractData(res);
  },

  startBreak: async (employeeId: string): Promise<BreakLog> => {
    const res = await api.post<ApiResponse<BreakLog>>(
      `/employees/${employeeId}/attendances`,
      { action: SessionAction.BREAK_START },
    );
    return extractData(res);
  },

  endBreak: async (employeeId: string): Promise<BreakLog> => {
    const res = await api.post<ApiResponse<BreakLog>>(
      `/employees/${employeeId}/attendances`,
      { action: SessionAction.BREAK_END },
    );
    return extractData(res);
  },

  /** An employee's own daily attendance in `params` range. Pass the same date for
   *  `from`/`to` for a "today" view (single-element array), or a wider range for history. */
  getHistory: async (employeeId: string, params: GetAttendanceParams = {}): Promise<AttendanceHistoryDay[]> => {
    const res = await api.get<ApiResponse<AttendanceHistoryDay[]>>(`/employees/${employeeId}/attendances`, {
      params,
    });
    return extractData(res);
  },

  /** Admin/report view - every employee's in/out time and daily hours. */
  getAll: async (params: GetAttendanceParams = {}): Promise<AttendanceHistoryDayForEmployee[]> => {
    const res = await api.get<ApiResponse<AttendanceHistoryDayForEmployee[]>>('/employees/attendances', { params });
    return extractData(res);
  },
};
