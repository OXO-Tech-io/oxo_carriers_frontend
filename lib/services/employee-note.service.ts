import api from '@/lib/api';
import { extractData } from '@/lib/services/http';
import type { ApiResponse } from '@/types/api';
import type { EmployeeNote } from '@/types/hrModules';

export const employeeNoteService = {
  create: async (employeeId: number, content: string, files: File[]): Promise<EmployeeNote> => {
    const formData = new FormData();
    formData.append('employeeId', String(employeeId));
    formData.append('content', content);
    files.forEach((file) => formData.append('attachments', file));
    const res = await api.post<ApiResponse<EmployeeNote>>('/employee-notes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return extractData(res);
  },

  listForEmployee: async (employeeId: number): Promise<EmployeeNote[]> => {
    const res = await api.get<ApiResponse<EmployeeNote[]>>(`/employee-notes/employees/${employeeId}`);
    return extractData(res);
  },

  update: async (id: number, content: string): Promise<EmployeeNote> => {
    const res = await api.put<ApiResponse<EmployeeNote>>(`/employee-notes/${id}`, { content });
    return extractData(res);
  },
};
