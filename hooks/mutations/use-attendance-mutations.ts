import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { attendanceService } from '@/lib/services/attendance.service';
import { activityAgentService } from '@/lib/services/activity-agent.service';
import { SessionAction } from '@/types/attendance';

function requireEmployeeId(employeeId: string | undefined): string {
  if (!employeeId) {
    throw new Error('Your account has no employee ID assigned yet');
  }
  return employeeId;
}

export const useClockInMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: () => attendanceService.clockIn(requireEmployeeId(user?.employee_id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attendance'] });
      activityAgentService.notify(SessionAction.CLOCK_IN, user?.employee_id);
    },
  });
};

export const useClockOutMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: () => attendanceService.clockOut(requireEmployeeId(user?.employee_id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attendance'] });
      activityAgentService.notify(SessionAction.CLOCK_OUT, user?.employee_id);
    },
  });
};

export const useStartBreakMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: () => attendanceService.startBreak(requireEmployeeId(user?.employee_id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attendance'] });
      activityAgentService.notify(SessionAction.BREAK_START, user?.employee_id);
    },
  });
};

export const useEndBreakMutation = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: () => attendanceService.endBreak(requireEmployeeId(user?.employee_id)),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attendance'] });
      activityAgentService.notify(SessionAction.BREAK_END, user?.employee_id);
    },
  });
};
