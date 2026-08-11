import type { AxiosResponse } from 'axios';
import api from '@/lib/api';
import { extractData } from '@/lib/services/http';
import type { ApiResponse } from '@/types/api';
import type {
  AgentPairingCode,
  AttendanceDashboardMetrics,
  AttendanceActivityEvent,
  AttendanceExportFormat,
  AttendanceHistoryPage,
  AttendanceHistoryParams,
  AttendanceHistoryRow,
  AttendanceReport,
  AttendanceReportParams,
  AttendanceReportType,
  AttendanceSettings,
  AttendanceSettingsUpdate,
  EmployeeDailySummary,
  EmployeeWorkSession,
  EndSessionResult,
  HeartbeatResult,
  LiveSessionRow,
  LiveSessionsParams,
  MyAttendanceHistoryParams,
  PairedAgentDevice,
  ProductivityRankParams,
  ProductivityRankRow,
  RecordActivityBatchPayload,
  RecordActivityBatchResult,
  StartSessionPayload,
  TodayAttendance,
} from '@/types/attendance';

/**
 * A downloaded export plus the filename the server chose. Unlike
 * work-log.service.ts's plain `Promise<Blob>` methods, the attendance exports
 * are parameterised by report type / format / date range, so the server-side
 * filename is genuinely more informative than anything the caller could build.
 * The blob is still the raw response body.
 */
export interface AttendanceDownload {
  blob: Blob;
  filename: string;
}

/** `attachment; filename=foo.xlsx` -> `foo.xlsx`. Falls back to `fallback`. */
const filenameFromResponse = (res: AxiosResponse, fallback: string): string => {
  const header = res.headers?.['content-disposition'] as string | undefined;
  if (!header) return fallback;
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(header);
  if (!match?.[1]) return fallback;
  try {
    return decodeURIComponent(match[1].trim());
  } catch {
    return match[1].trim();
  }
};

const toDownload = (res: AxiosResponse, fallback: string): AttendanceDownload => ({
  blob: res.data as Blob,
  filename: filenameFromResponse(res, fallback),
});

const extension: Record<AttendanceExportFormat, string> = {
  excel: 'xlsx',
  csv: 'csv',
  pdf: 'pdf',
};

export const attendanceService = {
  // ─── Session lifecycle (self-service, no permission key) ───────────────────

  /**
   * Opens a work session. Throws a 409 whose `response.data.details` is an
   * `ActiveSessionConflictDetails` when a session is already open and
   * multi-session is off - the caller renders the conflict prompt from it.
   */
  startSession: async (payload: StartSessionPayload = {}): Promise<EmployeeWorkSession> => {
    const res = await api.post<ApiResponse<EmployeeWorkSession>>('/attendance/session/start', payload);
    return extractData(res);
  },

  heartbeat: async (sessionToken: string): Promise<HeartbeatResult> => {
    const res = await api.post<ApiResponse<HeartbeatResult>>('/attendance/session/heartbeat', {
      sessionToken,
    });
    return extractData(res);
  },

  /**
   * Explicit "end my session" path. Idempotent, and the route is public - the
   * unload path uses `lib/attendance/endSessionBeacon.ts` instead, because
   * sendBeacon cannot go through axios.
   */
  endSession: async (sessionToken: string): Promise<EndSessionResult> => {
    const res = await api.post<ApiResponse<EndSessionResult>>('/attendance/session/end', {
      sessionToken,
    });
    return extractData(res);
  },

  forceTerminateSession: async (sessionId: number): Promise<EmployeeWorkSession> => {
    const res = await api.post<ApiResponse<EmployeeWorkSession>>(
      `/attendance/session/${sessionId}/force-terminate`,
    );
    return extractData(res);
  },

  getMySession: async (): Promise<EmployeeWorkSession | null> => {
    const res = await api.get<ApiResponse<EmployeeWorkSession | null>>('/attendance/session/mine');
    return extractData(res);
  },

  recordActivityBatch: async (
    payload: RecordActivityBatchPayload,
  ): Promise<RecordActivityBatchResult> => {
    const res = await api.post<ApiResponse<RecordActivityBatchResult>>(
      '/attendance/activity/batch',
      payload,
    );
    return extractData(res);
  },

  // ─── Self-service reads ────────────────────────────────────────────────────

  getToday: async (): Promise<TodayAttendance> => {
    const res = await api.get<ApiResponse<TodayAttendance>>('/attendance/me/today');
    return extractData(res);
  },

  getMyHistory: async (params: MyAttendanceHistoryParams = {}): Promise<EmployeeDailySummary[]> => {
    const res = await api.get<ApiResponse<EmployeeDailySummary[]>>('/attendance/me/history', {
      params,
    });
    return extractData(res);
  },

  // ─── Dashboard (attendance:read) ───────────────────────────────────────────

  listLiveSessions: async (params: LiveSessionsParams = {}): Promise<LiveSessionRow[]> => {
    const res = await api.get<ApiResponse<LiveSessionRow[]>>('/attendance/dashboard/live', {
      params,
    });
    return extractData(res);
  },

  getDashboardMetrics: async (): Promise<AttendanceDashboardMetrics> => {
    const res = await api.get<ApiResponse<AttendanceDashboardMetrics>>(
      '/attendance/dashboard/metrics',
    );
    return extractData(res);
  },

  getRecentActivity: async (limit?: number): Promise<AttendanceActivityEvent[]> => {
    const res = await api.get<ApiResponse<AttendanceActivityEvent[]>>(
      '/attendance/dashboard/recent-activity',
      { params: limit ? { limit } : undefined },
    );
    return extractData(res);
  },

  getTopProductive: async (params: ProductivityRankParams = {}): Promise<ProductivityRankRow[]> => {
    const res = await api.get<ApiResponse<ProductivityRankRow[]>>(
      '/attendance/dashboard/top-productive',
      { params },
    );
    return extractData(res);
  },

  getLeastProductive: async (
    params: ProductivityRankParams = {},
  ): Promise<ProductivityRankRow[]> => {
    const res = await api.get<ApiResponse<ProductivityRankRow[]>>(
      '/attendance/dashboard/least-productive',
      { params },
    );
    return extractData(res);
  },

  // ─── Admin history (attendance:read) ───────────────────────────────────────

  /**
   * The list route puts `total/limit/offset` alongside `data` rather than
   * inside it, so this reads the envelope directly instead of `extractData`.
   */
  listHistory: async (params: AttendanceHistoryParams = {}): Promise<AttendanceHistoryPage> => {
    const res = await api.get<
      ApiResponse<AttendanceHistoryRow[]> & { total: number; limit: number; offset: number }
    >('/attendance/history', { params });
    return {
      rows: res.data?.data ?? [],
      total: res.data?.total ?? 0,
      limit: res.data?.limit ?? 0,
      offset: res.data?.offset ?? 0,
    };
  },

  exportHistory: async (
    format: AttendanceExportFormat,
    params: AttendanceHistoryParams = {},
  ): Promise<AttendanceDownload> => {
    const res = await api.get('/attendance/history/export', {
      params: { ...params, format },
      responseType: 'blob',
    });
    return toDownload(res, `attendance-history.${extension[format]}`);
  },

  // ─── Reports (HR Manager / HR Executive server-side) ───────────────────────

  getReport: async (
    type: AttendanceReportType,
    params: AttendanceReportParams = {},
  ): Promise<AttendanceReport> => {
    const res = await api.get<ApiResponse<AttendanceReport>>(`/attendance/reports/${type}`, {
      params,
    });
    return extractData(res);
  },

  exportReport: async (
    type: AttendanceReportType,
    format: AttendanceExportFormat,
    params: AttendanceReportParams = {},
  ): Promise<AttendanceDownload> => {
    const res = await api.get(`/attendance/reports/${type}`, {
      params: { ...params, format },
      responseType: 'blob',
    });
    return toDownload(res, `attendance-${type}.${extension[format]}`);
  },

  // ─── Settings ──────────────────────────────────────────────────────────────

  getSettings: async (): Promise<AttendanceSettings> => {
    const res = await api.get<ApiResponse<AttendanceSettings>>('/attendance/settings');
    return extractData(res);
  },

  updateSettings: async (updates: AttendanceSettingsUpdate): Promise<AttendanceSettings> => {
    const res = await api.put<ApiResponse<AttendanceSettings>>('/attendance/settings', updates);
    return extractData(res);
  },

  // ─── Desktop agent pairing (self-service, no permission key) ───────────────

  /**
   * Mints a single-use code the employee types into the desktop app. The agent
   * redeems it against POST attendance/agent/pair - which this app never calls,
   * so no agent token ever passes through the browser.
   */
  generatePairingCode: async (): Promise<AgentPairingCode> => {
    const res = await api.post<ApiResponse<AgentPairingCode>>('/attendance/agent/pairing-code');
    return extractData(res);
  },

  /** The caller's own paired PCs, revoked ones included. Never returns a token. */
  listAgentDevices: async (): Promise<PairedAgentDevice[]> => {
    const res = await api.get<ApiResponse<PairedAgentDevice[]>>('/attendance/agent/devices');
    return extractData(res);
  },

  /** 404 `Paired device not found` means the id is not the caller's. */
  revokeAgentDevice: async (id: number): Promise<{ id: number; revoked: boolean }> => {
    const res = await api.post<ApiResponse<{ id: number; revoked: boolean }>>(
      `/attendance/agent/devices/${id}/revoke`,
    );
    return extractData(res);
  },
};
