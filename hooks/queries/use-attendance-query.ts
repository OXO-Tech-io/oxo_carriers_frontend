import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { attendanceService, type GetAttendanceParams } from '@/lib/services/attendance.service';

/** An employee's own daily attendance for `params` range. Pass the same date for
 *  `from`/`to` for a "today" view, or a wider range for history. */
export const useAttendanceHistoryQuery = (params: GetAttendanceParams = {}) => {
  const { user } = useAuth();
  const employeeId = user?.employee_id;
  return useQuery({
    queryKey: ['attendance', 'history', employeeId ?? null, params.from ?? null, params.to ?? null],
    queryFn: () => attendanceService.getHistory(employeeId!, params),
    enabled: Boolean(employeeId),
  });
};

/** Admin/report view - every employee's in/out time and daily hours. */
export const useAllAttendanceQuery = (params: GetAttendanceParams = {}, enabled = true) =>
  useQuery({
    queryKey: ['attendance', 'all', params.from ?? null, params.to ?? null],
    queryFn: () => attendanceService.getAll(params),
    enabled,
  });
