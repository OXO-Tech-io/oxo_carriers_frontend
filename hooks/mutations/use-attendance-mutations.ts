import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '@/lib/services/attendance.service';
import { attendanceQueryKeys } from '@/hooks/queries/use-attendance-query';
import type { AttendanceSettingsUpdate, StartSessionPayload } from '@/types/attendance';

export const useStartSessionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: StartSessionPayload = {}) => attendanceService.startSession(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.mySession() });
      void queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.today() });
    },
  });
};

/**
 * Deliberately does not invalidate anything: it fires every 30s from the
 * tracking provider, and refetching today's summary on that cadence would put
 * the whole app on a 30s render loop for no visible gain.
 */
export const useHeartbeatMutation = () =>
  useMutation({
    mutationFn: (sessionToken: string) => attendanceService.heartbeat(sessionToken),
  });

/** Explicit "end my session" path - the unload path uses the beacon instead. */
export const useEndSessionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionToken: string) => attendanceService.endSession(sessionToken),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.mySession() });
      void queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.today() });
    },
  });
};

export const useForceTerminateMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: number) => attendanceService.forceTerminateSession(sessionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.mySession() });
      void queryClient.invalidateQueries({ queryKey: ['attendance', 'dashboard'] });
    },
  });
};

export const useRecordActivityBatchMutation = () =>
  useMutation({
    mutationFn: attendanceService.recordActivityBatch,
  });

export const useUpdateAttendanceSettingsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: AttendanceSettingsUpdate) => attendanceService.updateSettings(updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.settings() });
    },
  });
};

/**
 * Nothing to invalidate: the device row only appears once the desktop agent
 * redeems the code, which happens outside this browser.
 */
export const useGeneratePairingCodeMutation = () =>
  useMutation({
    mutationFn: () => attendanceService.generatePairingCode(),
  });

export const useRevokeAgentDeviceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => attendanceService.revokeAgentDevice(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.agentDevices() });
    },
  });
};
