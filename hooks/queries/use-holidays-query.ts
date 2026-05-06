import { useQuery } from '@tanstack/react-query';
import { leaveCalendarService } from '@/lib/services/leave-calendar.service';

export const holidaysQueryKey = (startDate: string, endDate: string) =>
  ['leave-calendar', 'range', startDate, endDate] as const;

export const useHolidaysQuery = (
  startDate: string,
  endDate: string,
  options?: { enabled?: boolean }
) =>
  useQuery({
    queryKey: holidaysQueryKey(startDate, endDate),
    queryFn: () =>
      leaveCalendarService.getHolidaysInRange(startDate, endDate),
    enabled: (options?.enabled ?? true) && !!startDate && !!endDate,
  });
