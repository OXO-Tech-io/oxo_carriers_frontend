// Simple manual clock in/out - not the full session/heartbeat/idle time
// tracker (that lives, unbuilt against a backend, on the unmerged
// feature/time-tracking branch). Mirrors the backend's attendance module
// response shapes exactly (see oxo_carriers_backend/src/modules/attendance).

export interface AttendanceSession {
  id: number;
  employeeId: string;
  loginAt: string | null;
  logoutAt: string | null;
  status: string;
  totalDurationSec: number | null;
}

export interface TodayAttendance {
  sessions: AttendanceSession[];
  firstLoginAt: string | null;
  lastLogoutAt: string | null;
  totalDurationSec: number;
  status: 'active' | 'ended' | 'none';
}

export interface AttendanceHistoryDay {
  date: string;
  firstLoginAt: string | null;
  lastLogoutAt: string | null;
  totalDurationSec: number;
  sessionCount: number;
}

// Admin/report view (GET /attendance) - one row per employee per day.
export interface AttendanceHistoryDayForEmployee extends AttendanceHistoryDay {
  employeeId: string;
  firstName: string;
  lastName: string;
}
