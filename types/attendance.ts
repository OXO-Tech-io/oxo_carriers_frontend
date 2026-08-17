// Simple manual clock in/out - not the full session/heartbeat/idle time
// tracker (that lives, unbuilt against a backend, on the unmerged
// feature/time-tracking branch). Mirrors the backend's attendance module
// response shapes exactly (see oxo_carriers_backend/src/modules/attendance).

export enum SessionAction {
  CLOCK_IN = 'clock_in',
  CLOCK_OUT = 'clock_out',
}

export interface AttendanceSession {
  id: number;
  employeeId: string;
  loginAt: string | null;
  logoutAt: string | null;
  status: string;
  totalDurationSec: number | null;
}

// GET /employees/:employeeId/attendances?from=...&to=... - one row per day in
// range. Pass the same date for `from`/`to` for a "today" view (single-element
// array), or a wider range for history.
export interface AttendanceHistoryDay {
  date: string;
  sessions: AttendanceSession[];
  firstLoginAt: string | null;
  lastLogoutAt: string | null;
  totalDurationSec: number;
  status: 'active' | 'ended' | 'none';
}

// Admin/report view (GET /employees/attendances) - one row per employee per day.
export interface AttendanceHistoryDayForEmployee {
  date: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  firstLoginAt: string | null;
  lastLogoutAt: string | null;
  totalDurationSec: number;
  sessionCount: number;
}
