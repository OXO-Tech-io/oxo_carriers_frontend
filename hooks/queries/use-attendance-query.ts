import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '@/lib/services/attendance.service';
import type {
  AttendanceHistoryParams,
  AttendanceReportParams,
  AttendanceReportType,
  LiveSessionsParams,
  MyAttendanceHistoryParams,
  ProductivityRankParams,
} from '@/types/attendance';

type QueryOptions = { enabled?: boolean };

export const attendanceQueryKeys = {
  today: () => ['attendance', 'me', 'today'] as const,
  mySession: () => ['attendance', 'session', 'mine'] as const,
  myHistory: (params: MyAttendanceHistoryParams) =>
    ['attendance', 'me', 'history', params] as const,
  live: (params: LiveSessionsParams) => ['attendance', 'dashboard', 'live', params] as const,
  metrics: () => ['attendance', 'dashboard', 'metrics'] as const,
  recentActivity: (limit?: number) =>
    ['attendance', 'dashboard', 'recent-activity', limit ?? 'default'] as const,
  topProductive: (params: ProductivityRankParams) =>
    ['attendance', 'dashboard', 'top-productive', params] as const,
  leastProductive: (params: ProductivityRankParams) =>
    ['attendance', 'dashboard', 'least-productive', params] as const,
  history: (params: AttendanceHistoryParams) => ['attendance', 'history', params] as const,
  report: (type: AttendanceReportType, params: AttendanceReportParams) =>
    ['attendance', 'reports', type, params] as const,
  settings: () => ['attendance', 'settings'] as const,
  agentDevices: () => ['attendance', 'agent', 'devices'] as const,
};

// ─── Self-service ────────────────────────────────────────────────────────────

export const useTodaySummaryQuery = (options?: QueryOptions) =>
  useQuery({
    queryKey: attendanceQueryKeys.today(),
    queryFn: () => attendanceService.getToday(),
    enabled: options?.enabled ?? true,
  });

export const useMySessionQuery = (options?: QueryOptions) =>
  useQuery({
    queryKey: attendanceQueryKeys.mySession(),
    queryFn: () => attendanceService.getMySession(),
    enabled: options?.enabled ?? true,
  });

export const useMyAttendanceHistoryQuery = (
  params: MyAttendanceHistoryParams = {},
  options?: QueryOptions,
) =>
  useQuery({
    queryKey: attendanceQueryKeys.myHistory(params),
    queryFn: () => attendanceService.getMyHistory(params),
    enabled: options?.enabled ?? true,
  });

// ─── Dashboard ───────────────────────────────────────────────────────────────

/**
 * Live monitoring. Polls on a short cadence while the tab is visible;
 * `refetchIntervalInBackground: false` stops a parked monitoring tab from
 * hammering the API all night.
 */
export const useLiveSessionsQuery = (params: LiveSessionsParams = {}, options?: QueryOptions) =>
  useQuery({
    queryKey: attendanceQueryKeys.live(params),
    queryFn: () => attendanceService.listLiveSessions(params),
    enabled: options?.enabled ?? true,
    refetchInterval: 12000,
    refetchIntervalInBackground: false,
  });

export const useAdminDashboardMetricsQuery = (options?: QueryOptions) =>
  useQuery({
    queryKey: attendanceQueryKeys.metrics(),
    queryFn: () => attendanceService.getDashboardMetrics(),
    enabled: options?.enabled ?? true,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

export const useRecentActivityQuery = (limit?: number, options?: QueryOptions) =>
  useQuery({
    queryKey: attendanceQueryKeys.recentActivity(limit),
    queryFn: () => attendanceService.getRecentActivity(limit),
    enabled: options?.enabled ?? true,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });

export const useTopProductiveQuery = (
  params: ProductivityRankParams = {},
  options?: QueryOptions,
) =>
  useQuery({
    queryKey: attendanceQueryKeys.topProductive(params),
    queryFn: () => attendanceService.getTopProductive(params),
    enabled: options?.enabled ?? true,
  });

export const useLeastProductiveQuery = (
  params: ProductivityRankParams = {},
  options?: QueryOptions,
) =>
  useQuery({
    queryKey: attendanceQueryKeys.leastProductive(params),
    queryFn: () => attendanceService.getLeastProductive(params),
    enabled: options?.enabled ?? true,
  });

// ─── Admin history & reports ─────────────────────────────────────────────────

export const useAdminAttendanceHistoryQuery = (
  params: AttendanceHistoryParams = {},
  options?: QueryOptions,
) =>
  useQuery({
    queryKey: attendanceQueryKeys.history(params),
    queryFn: () => attendanceService.listHistory(params),
    enabled: options?.enabled ?? true,
  });

export const useAttendanceReportQuery = (
  type: AttendanceReportType,
  params: AttendanceReportParams = {},
  options?: QueryOptions,
) =>
  useQuery({
    queryKey: attendanceQueryKeys.report(type, params),
    queryFn: () => attendanceService.getReport(type, params),
    enabled: options?.enabled ?? true,
    // Reports are role-gated server-side; a 403 is a permanent answer for this
    // user, so retrying it just delays the "you cannot see this" message.
    retry: false,
  });

// ─── Settings ────────────────────────────────────────────────────────────────

export const useAttendanceSettingsQuery = (options?: QueryOptions) =>
  useQuery({
    queryKey: attendanceQueryKeys.settings(),
    queryFn: () => attendanceService.getSettings(),
    enabled: options?.enabled ?? true,
  });

// ─── Desktop agent pairing ───────────────────────────────────────────────────

/**
 * The list only changes when this user pairs or revokes a device, and both of
 * those invalidate it explicitly - so it never needs polling, and a long
 * `staleTime` keeps revisits to the page free.
 */
export const useAgentDevicesQuery = (options?: QueryOptions) =>
  useQuery({
    queryKey: attendanceQueryKeys.agentDevices(),
    queryFn: () => attendanceService.listAgentDevices(),
    enabled: options?.enabled ?? true,
    staleTime: 5 * 60 * 1000,
  });
