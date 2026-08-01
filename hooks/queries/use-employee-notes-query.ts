import { useQuery } from '@tanstack/react-query';
import { employeeNoteService } from '@/lib/services/employee-note.service';

export const employeeNotesQueryKey = (employeeId: number) => ['employee-notes', employeeId] as const;

export const useEmployeeNotesQuery = (employeeId: number, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: employeeNotesQueryKey(employeeId),
    queryFn: () => employeeNoteService.listForEmployee(employeeId),
    enabled: options?.enabled ?? true,
  });
