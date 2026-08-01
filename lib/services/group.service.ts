import api from '@/lib/api';
import { extractData } from '@/lib/services/http';
import type { ApiResponse } from '@/types/api';
import type { Group, GroupWithMembers } from '@/types/hrModules';

export const groupService = {
  list: async (): Promise<Group[]> => {
    const res = await api.get<ApiResponse<Group[]>>('/groups');
    return extractData(res);
  },

  getById: async (id: number): Promise<GroupWithMembers> => {
    const res = await api.get<ApiResponse<GroupWithMembers>>(`/groups/${id}`);
    return extractData(res);
  },

  create: async (name: string): Promise<Group> => {
    const res = await api.post<ApiResponse<Group>>('/groups', { name });
    return extractData(res);
  },

  rename: async (id: number, name: string): Promise<Group> => {
    const res = await api.patch<ApiResponse<Group>>(`/groups/${id}`, { name });
    return extractData(res);
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/groups/${id}`);
  },

  addMembers: async (id: number, userIds: number[]): Promise<void> => {
    await api.post(`/groups/${id}/members`, { userIds });
  },

  removeMember: async (id: number, userId: number): Promise<void> => {
    await api.delete(`/groups/${id}/members/${userId}`);
  },
};
