import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { attendanceService, type GetAllAttendanceParams } from '@/lib/services/attendance.service';

export const useTodayAttendanceQuery = () => {
  const { user } = useAuth();
  const employeeId = user?.employee_id;
  return useQuery({
    queryKey: ['attendance', 'today', employeeId ?? null],
    queryFn: () => attendanceService.getToday(employeeId!),
    enabled: Boolean(employeeId),
  });
};

export const useAttendanceHistoryQuery = (limit?: number) => {
  const { user } = useAuth();
  const employeeId = user?.employee_id;
  return useQuery({
    queryKey: ['attendance', 'history', employeeId ?? null, limit ?? null],
    queryFn: () => attendanceService.getHistory(employeeId!, limit),
    enabled: Boolean(employeeId),
  });
};

/** Admin/report view - every employee's in/out time and daily hours. */
export const useAllAttendanceQuery = (params: GetAllAttendanceParams = {}, enabled = true) =>
  useQuery({
    queryKey: ['attendance', 'all', params.from ?? null, params.to ?? null],
    queryFn: () => attendanceService.getAll(params),
    enabled,
  });
