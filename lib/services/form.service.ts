import api from '@/lib/api';
import { extractData } from '@/lib/services/http';
import type { ApiResponse } from '@/types/api';
import type { AssignedForm, FormFieldDraft, FormResponseWithAnswers, HrForm } from '@/types/hrModules';

export interface CreateFormInput {
  title: string;
  description?: string;
  fields: FormFieldDraft[];
}

export interface FormWithFields {
  form: HrForm;
  fields: import('@/types/hrModules').FormField[];
}

export const formService = {
  list: async (): Promise<HrForm[]> => {
    const res = await api.get<ApiResponse<HrForm[]>>('/forms');
    return extractData(res);
  },

  create: async (input: CreateFormInput): Promise<FormWithFields> => {
    const res = await api.post<ApiResponse<FormWithFields>>('/forms', input);
    return extractData(res);
  },

  getById: async (id: number): Promise<FormWithFields> => {
    const res = await api.get<ApiResponse<FormWithFields>>(`/forms/${id}`);
    return extractData(res);
  },

  publish: async (id: number): Promise<HrForm> => {
    const res = await api.post<ApiResponse<HrForm>>(`/forms/${id}/publish`);
    return extractData(res);
  },

  distribute: async (id: number, userIds: number[]): Promise<void> => {
    await api.post(`/forms/${id}/distribute`, { userIds });
  },

  listAssignedToMe: async (): Promise<AssignedForm[]> => {
    const res = await api.get<ApiResponse<AssignedForm[]>>('/forms/mine');
    return extractData(res);
  },

  submitResponse: async (id: number, answers: { fieldId: number; value?: string }[], files: Record<number, File>): Promise<void> => {
    const formData = new FormData();
    formData.append('answers', JSON.stringify(answers));
    Object.entries(files).forEach(([fieldId, file]) => formData.append(`field_${fieldId}`, file));
    await api.post(`/forms/${id}/responses`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  listResponses: async (id: number): Promise<FormResponseWithAnswers[]> => {
    const res = await api.get<ApiResponse<FormResponseWithAnswers[]>>(`/forms/${id}/responses`);
    return extractData(res);
  },

  downloadResponses: async (id: number): Promise<Blob> => {
    const res = await api.get(`/forms/${id}/responses/export`, { responseType: 'blob' });
    return res.data as Blob;
  },
};
