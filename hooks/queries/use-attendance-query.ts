import { useQuery } from '@tanstack/react-query';
import { attendanceService, type GetAllAttendanceParams } from '@/lib/services/attendance.service';

export const useTodayAttendanceQuery = () =>
  useQuery({
    queryKey: ['attendance', 'today'],
    queryFn: () => attendanceService.getToday(),
  });

export const useAttendanceHistoryQuery = (limit?: number) =>
  useQuery({
    queryKey: ['attendance', 'history', limit ?? null],
    queryFn: () => attendanceService.getHistory(limit),
  });

/** Admin/report view - every employee's in/out time and daily hours. */
export const useAllAttendanceQuery = (params: GetAllAttendanceParams = {}, enabled = true) =>
  useQuery({
    queryKey: ['attendance', 'all', params.from ?? null, params.to ?? null],
    queryFn: () => attendanceService.getAll(params),
    enabled,
  });
