import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  leaveCalendarAdminService,
  type LeaveCalendarEntryInput,
} from "@/lib/services/leave-calendar-admin.service";

export const useCreateLeaveCalendarEntryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: LeaveCalendarEntryInput) =>
      leaveCalendarAdminService.createEntry(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["leave-calendar"] });
    },
  });
};

export const useUpdateLeaveCalendarEntryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: LeaveCalendarEntryInput;
    }) => leaveCalendarAdminService.updateEntry(id, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["leave-calendar"] });
    },
  });
};

export const useDeleteLeaveCalendarEntryMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => leaveCalendarAdminService.deleteEntry(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["leave-calendar"] });
    },
  });
};
