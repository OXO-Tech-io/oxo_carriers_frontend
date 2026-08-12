import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '@/lib/services/attendance.service';

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
