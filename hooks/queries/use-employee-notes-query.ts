import { useQuery } from '@tanstack/react-query';
import { employeeNoteService } from '@/lib/services/employee-note.service';

export const employeeNotesQueryKey = (employeeUserId: number) => ['employee-notes', employeeUserId] as const;

export const useEmployeeNotesQuery = (employeeUserId: number, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: employeeNotesQueryKey(employeeUserId),
    queryFn: () => employeeNoteService.listForEmployee(employeeUserId),
    enabled: options?.enabled ?? true,
  });
