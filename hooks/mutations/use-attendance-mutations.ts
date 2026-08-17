import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { attendanceService } from '@/lib/services/attendance.service';

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
    },
  });
};
