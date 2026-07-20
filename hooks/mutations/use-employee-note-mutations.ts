import { useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeNoteService } from '@/lib/services/employee-note.service';
import { employeeNotesQueryKey } from '@/hooks/queries/use-employee-notes-query';

export const useCreateEmployeeNoteMutation = (employeeUserId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ content, files }: { content: string; files: File[] }) =>
      employeeNoteService.create(employeeUserId, content, files),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: employeeNotesQueryKey(employeeUserId) });
    },
  });
};

export const useUpdateEmployeeNoteMutation = (employeeUserId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: number; content: string }) => employeeNoteService.update(id, content),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: employeeNotesQueryKey(employeeUserId) });
    },
  });
};
