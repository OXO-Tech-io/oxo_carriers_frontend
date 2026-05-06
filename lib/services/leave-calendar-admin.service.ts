import api from "@/lib/api";
import { extractData } from "@/lib/services/http";
import type { ApiResponse } from "@/types/api";

export interface LeaveCalendarEntry {
  id: number;
  date: string;
  name: string;
  description?: string;
  is_recurring: boolean;
  year?: number;
}

export interface LeaveCalendarEntryInput {
  date: string;
  name: string;
  description?: string;
  is_recurring?: boolean;
  year?: number;
}

export const leaveCalendarAdminService = {
  listByYear: async (year: number): Promise<LeaveCalendarEntry[]> => {
    const res = await api.get<
      ApiResponse<LeaveCalendarEntry[]> | LeaveCalendarEntry[]
    >("/leave-calendar", {
      params: { year },
    });
    return extractData<LeaveCalendarEntry[]>(res as never);
  },

  createEntry: async (
    payload: LeaveCalendarEntryInput,
  ): Promise<LeaveCalendarEntry> => {
    const res = await api.post<
      ApiResponse<LeaveCalendarEntry> | LeaveCalendarEntry
    >("/leave-calendar", payload);
    return extractData<LeaveCalendarEntry>(res as never);
  },

  updateEntry: async (
    id: number,
    payload: LeaveCalendarEntryInput,
  ): Promise<LeaveCalendarEntry> => {
    const res = await api.put<
      ApiResponse<LeaveCalendarEntry> | LeaveCalendarEntry
    >(`/leave-calendar/${id}`, payload);
    return extractData<LeaveCalendarEntry>(res as never);
  },

  deleteEntry: async (id: number): Promise<void> => {
    await api.delete(`/leave-calendar/${id}`);
  },
};
