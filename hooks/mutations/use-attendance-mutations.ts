import { useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '@/lib/services/attendance.service';

export const useClockInMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => attendanceService.clockIn(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
};

export const useClockOutMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => attendanceService.clockOut(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });
};
