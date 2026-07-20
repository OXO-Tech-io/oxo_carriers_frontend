import api from '@/lib/api';
import { extractData } from '@/lib/services/http';
import type { ApiResponse } from '@/types/api';
import type { EventParticipant, HrEvent } from '@/types/hrModules';

export interface CreateEventInput {
  name: string;
  description?: string;
  eventDate: string;
  location?: string;
}

export interface RecordParticipationInput {
  userId: number;
  participated: boolean;
  willParticipate?: boolean | null;
}

export const eventService = {
  list: async (): Promise<HrEvent[]> => {
    const res = await api.get<ApiResponse<HrEvent[]>>('/events');
    return extractData(res);
  },

  create: async (input: CreateEventInput): Promise<HrEvent> => {
    const res = await api.post<ApiResponse<HrEvent>>('/events', input);
    return extractData(res);
  },

  getWithParticipants: async (id: number): Promise<{ event: HrEvent; participants: EventParticipant[] }> => {
    const res = await api.get<ApiResponse<{ event: HrEvent; participants: EventParticipant[] }>>(`/events/${id}`);
    return extractData(res);
  },

  recordParticipation: async (id: number, participants: RecordParticipationInput[]): Promise<EventParticipant[]> => {
    const res = await api.post<ApiResponse<EventParticipant[]>>(`/events/${id}/participation`, { participants });
    return extractData(res);
  },
};
