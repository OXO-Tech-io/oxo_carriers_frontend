// ─── Employee Time Tracker (attendance & productivity monitoring) ────────────
//
// Mirrors the backend `attendance` module exactly. Every timestamp arrives as
// an ISO string (the API JSON-serialises Postgres timestamps), and every
// duration is in whole seconds unless the field name says otherwise.

/** Stored session status. `active | idle | disconnected` mean "still running". */
export type WorkSessionStatus =
  | 'active'
  | 'idle'
  | 'disconnected'
  | 'ended'
  | 'abnormal_logout';

export type WorkSessionEndReason =
  | 'user_logout'
  | 'force_terminated'
  | 'abnormal_timeout'
  | 'admin_terminated';

/** Derived-on-read presence, not the stored session status. */
export type LiveStatus = 'online' | 'idle' | 'offline';

/** Day classification on the daily rollup. */
export type AttendanceDayStatus = 'present' | 'partial' | 'absent';

export type DeviceType = 'desktop' | 'laptop' | 'tablet' | 'mobile' | 'other';

export type AttendanceExportFormat = 'excel' | 'csv' | 'pdf';

/** DOM events the client is allowed to report. Never the key/content itself. */
export type ActivityEventType =
  | 'mouse_move'
  | 'click'
  | 'keypress'
  | 'scroll'
  | 'focus'
  | 'blur'
  | 'visibility_change';

// ─── Core records ────────────────────────────────────────────────────────────

/**
 * One row per login. The duration columns stay null until the session closes -
 * they are computed once at end time, never incrementally.
 */
export interface EmployeeWorkSession {
  id: number;
  employeeId: string;
  sessionToken: string;
  loginAt: string | null;
  logoutAt: string | null;
  lastHeartbeatAt: string | null;
  status: string;
  endReason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  browser: string | null;
  os: string | null;
  deviceType: string | null;
  timezone: string | null;
  totalDurationSec: number | null;
  activeSec: number | null;
  idleSec: number | null;
  productiveSec: number | null;
  unproductiveSec: number | null;
  isLate: boolean;
  isEarlyLogout: boolean;
  terminatedByEmployeeId: string | null;
  createdAt: string | null;
}

/**
 * One row per employee per day, rebuilt (never incremented) from that day's
 * sessions. `efficiencyPct` is a numeric column, so it comes back as a string.
 */
export interface EmployeeDailySummary {
  id: number;
  employeeId: string;
  summaryDate: string;
  firstLoginAt: string | null;
  lastLogoutAt: string | null;
  totalLoggedSec: number;
  activeSec: number;
  idleSec: number;
  productiveSec: number;
  unproductiveSec: number;
  /** Reserved for an explicit break tracker; always 0 until one exists. */
  breakSec: number;
  efficiencyPct: string | null;
  sessionCount: number;
  isLate: boolean;
  isEarlyLogout: boolean;
  hadAbnormalLogout: boolean;
  status: AttendanceDayStatus;
  computedAt: string | null;
}

// ─── Session lifecycle ───────────────────────────────────────────────────────

/** No `ipAddress` - the server reads it from the request, never from the body. */
export interface StartSessionPayload {
  userAgent?: string;
  timezone?: string;
  deviceType?: DeviceType;
}

/** `details` on the 409 from POST attendance/session/start. */
export interface ActiveSessionConflictDetails {
  code: 'active_session_exists';
  session: {
    id: number;
    loginAt: string | null;
    lastHeartbeatAt: string | null;
    status: string;
    browser: string | null;
    os: string | null;
    deviceType: string | null;
    ipAddress: string | null;
  };
}

export interface HeartbeatResult {
  sessionId: number;
  /** Authoritative status - the client never decides it is idle by itself. */
  status: 'active' | 'idle';
  lastHeartbeatAt: string;
  secondsSinceActivity: number;
  idleThresholdSec: number;
  idleOpened: boolean;
}

export interface EndSessionResult {
  session: EmployeeWorkSession;
  alreadyEnded: boolean;
}

export interface ActivityEventPayload {
  eventType: ActivityEventType;
  eventCount?: number;
  /** ISO timestamp for the start of the client-side sampling bucket. */
  bucketStart: string;
}

export interface RecordActivityBatchPayload {
  sessionToken: string;
  /** Hard-capped at 500 server-side; batch client-side so it is never exceeded. */
  events: ActivityEventPayload[];
}

/** `skipped: true` means monitoring is off server-side - not an error. */
export interface RecordActivityBatchResult {
  skipped: boolean;
  sessionId: number | null;
  recorded: number;
  status: string;
  idleClosed: boolean;
  idleRecorded: boolean;
}

// ─── Self-service reads ──────────────────────────────────────────────────────

export interface TodayAttendance {
  date: string;
  sessions: EmployeeWorkSession[];
  summary: EmployeeDailySummary;
  currentStatus: LiveStatus;
}

export interface MyAttendanceHistoryParams {
  from?: string;
  to?: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface LiveSessionRow {
  sessionId: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  department: string | null;
  status: LiveStatus;
  sessionStatus: string;
  loginAt: string | null;
  lastHeartbeatAt: string | null;
  workingDurationSec: number;
  isLate: boolean;
  browser: string | null;
  deviceType: string | null;
}

export interface LiveSessionsParams {
  department?: string;
  status?: LiveStatus;
}

export interface AttendanceDashboardMetrics {
  date: string;
  onlineNow: number;
  idleNow: number;
  offlineNow: number;
  loggedInToday: number;
  avgWorkingHours: number;
  avgProductivityPct: number;
  avgIdleMinutes: number;
  attendancePct: number;
  lateCount: number;
  earlyLogoutCount: number;
}

export interface AttendanceActivityEvent {
  sessionId: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  department: string | null;
  event: 'login' | 'logout';
  at: string | null;
  status: string;
  endReason: string | null;
}

export interface ProductivityRankRow {
  employeeId: string;
  name: string;
  department: string | null;
  efficiencyPct: number;
  totalLoggedHours: number;
  activeHours: number;
  daysTracked: number;
}

export interface ProductivityRankParams {
  from?: string;
  to?: string;
  limit?: number;
}

// ─── Admin history ───────────────────────────────────────────────────────────

export interface AttendanceHistoryRow {
  id: number;
  employeeId: string;
  name: string;
  department: string | null;
  summaryDate: string;
  firstLoginAt: string | null;
  lastLogoutAt: string | null;
  totalLoggedSec: number;
  activeSec: number;
  idleSec: number;
  productiveSec: number;
  unproductiveSec: number;
  efficiencyPct: number | null;
  sessionCount: number;
  isLate: boolean;
  isEarlyLogout: boolean;
  hadAbnormalLogout: boolean;
  status: AttendanceDayStatus;
}

export interface AttendanceHistoryParams {
  employeeId?: string;
  department?: string;
  status?: AttendanceDayStatus;
  from?: string;
  to?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

/** The history list route puts `total/limit/offset` beside `data`, not inside. */
export interface AttendanceHistoryPage {
  rows: AttendanceHistoryRow[];
  total: number;
  limit: number;
  offset: number;
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export type AttendanceReportType =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'productivity'
  | 'department-productivity'
  | 'idle-time'
  | 'late-login'
  | 'early-logout'
  | 'online-duration';

export interface AttendanceReportColumn {
  key: string;
  header: string;
  /** Excel column width / relative PDF column width. */
  width?: number;
}

export type AttendanceReportRow = Record<
  string,
  string | number | boolean | null | undefined
>;

/**
 * Uniform envelope shared by all nine reports, which is why one table + chart
 * component can render any of them by iterating `columns`.
 */
export interface AttendanceReport {
  type: AttendanceReportType;
  title: string;
  params: Record<string, unknown>;
  columns: AttendanceReportColumn[];
  rows: AttendanceReportRow[];
  totals: Record<string, number>;
}

/** One shared query shape - each report reads only the params it understands. */
export interface AttendanceReportParams {
  date?: string;
  weekStart?: string;
  year?: number;
  month?: number;
  from?: string;
  to?: string;
  employeeId?: string;
  department?: string;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface AttendanceSettings {
  heartbeatGraceSec: number;
  idleThresholdSec: number;
  disconnectedThresholdSec: number;
  abnormalCloseGraceMin: number;
  allowMultipleSessions: boolean;
  activityMonitoringEnabled: boolean;
  /** 24-hour 'HH:MM'. */
  lateLoginTime: string;
  /** 24-hour 'HH:MM'. */
  earlyLogoutTime: string;
  /** IANA zone, e.g. 'Asia/Colombo'. */
  timezone: string;
  activityLogRetentionDays: number;
  updatedBy: number | null;
  updatedAt: string | null;
  /** Mirrors what PUT will allow, so the form only renders when it can save. */
  canEdit: boolean;
}

export type AttendanceSettingsUpdate = Partial<
  Omit<AttendanceSettings, 'updatedBy' | 'updatedAt' | 'canEdit'>
>;

// ─── Desktop agent pairing ───────────────────────────────────────────────────
//
// The desktop agent runs outside the browser and reports OS-level activity as
// its own session (`source: 'desktop_agent'`). It authorises itself by
// redeeming a one-time code the employee generates here; the web app never
// calls the pair endpoint itself, and no token ever reaches this app.

/** Single-use, 8 characters, valid for 10 minutes from issue. */
export interface AgentPairingCode {
  code: string;
  expiresAt: string;
}

export type AgentPlatform = 'windows' | 'macos';

/** One paired PC. `revokedAt` set means the device's token no longer works. */
export interface PairedAgentDevice {
  id: number;
  deviceName: string | null;
  platform: AgentPlatform | null;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}
