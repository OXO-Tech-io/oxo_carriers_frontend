import api from '@/lib/api';
import { extractData } from '@/lib/services/http';
import type { ApiResponse } from '@/types/api';
import type {
  AssignedForm,
  FormAnalytics,
  FormAnswerInput,
  FormLogicAction,
  FormLogicCombinator,
  FormLogicComparator,
  FormLogicRule,
  FormQuestion,
  FormQuestionConfig,
  FormResponseWithAnswers,
  FormSection,
  FormSettings,
  FormTheme,
  FormWithGraph,
  HrForm,
  MyFormResponse,
} from '@/types/hrModules';

export interface CreateFormInput {
  title: string;
  description?: string;
  closeAt?: string | null;
}

export interface UpdateFormInput {
  title?: string;
  description?: string | null;
}

export interface CreateSectionInput {
  title?: string;
  description?: string;
}

export interface UpdateSectionInput {
  title?: string;
  description?: string | null;
}

export interface QuestionOptionInput {
  id?: number;
  label: string;
  value: string;
  isOther?: boolean;
}

export interface CreateQuestionInput {
  sectionId?: number | null;
  type: FormQuestion['type'];
  title?: string;
  description?: string;
  helpText?: string;
  placeholder?: string;
  required?: boolean;
  config?: FormQuestionConfig;
  defaultValue?: unknown;
  options?: QuestionOptionInput[];
}

export interface UpdateQuestionInput {
  sectionId?: number | null;
  type?: FormQuestion['type'];
  title?: string;
  description?: string | null;
  helpText?: string | null;
  placeholder?: string | null;
  required?: boolean;
  config?: FormQuestionConfig;
  defaultValue?: unknown;
  options?: QuestionOptionInput[];
}

export interface CreateLogicRuleInput {
  targetQuestionId: number;
  sourceQuestionId: number;
  comparator: FormLogicComparator;
  comparisonValue?: unknown;
  action?: FormLogicAction;
  combinator?: FormLogicCombinator;
}

export interface UpdateLogicRuleInput {
  sourceQuestionId?: number;
  comparator?: FormLogicComparator;
  comparisonValue?: unknown;
  action?: FormLogicAction;
  combinator?: FormLogicCombinator;
}

export const formService = {
  list: async (): Promise<HrForm[]> => {
    const res = await api.get<ApiResponse<HrForm[]>>('/forms');
    return extractData(res);
  },

  create: async (input: CreateFormInput): Promise<HrForm> => {
    const res = await api.post<ApiResponse<HrForm>>('/forms', input);
    return extractData(res);
  },

  getById: async (id: number): Promise<FormWithGraph> => {
    const res = await api.get<ApiResponse<FormWithGraph>>(`/forms/${id}`);
    return extractData(res);
  },

  update: async (id: number, input: UpdateFormInput): Promise<HrForm> => {
    const res = await api.put<ApiResponse<HrForm>>(`/forms/${id}`, input);
    return extractData(res);
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/forms/${id}`);
  },

  duplicate: async (id: number): Promise<HrForm> => {
    const res = await api.post<ApiResponse<HrForm>>(`/forms/${id}/duplicate`);
    return extractData(res);
  },

  publish: async (id: number): Promise<HrForm> => {
    const res = await api.post<ApiResponse<HrForm>>(`/forms/${id}/publishes`);
    return extractData(res);
  },

  unpublish: async (id: number): Promise<HrForm> => {
    const res = await api.post<ApiResponse<HrForm>>(`/forms/${id}/unpublishes`);
    return extractData(res);
  },

  archive: async (id: number): Promise<HrForm> => {
    const res = await api.post<ApiResponse<HrForm>>(`/forms/${id}/archives`);
    return extractData(res);
  },

  distribute: async (id: number, userIds: number[], groupIds: number[], closeAt?: string | null): Promise<void> => {
    await api.post(`/forms/${id}/distributes`, { userIds, groupIds, closeAt });
  },

  listAssignedToMe: async (): Promise<AssignedForm[]> => {
    const res = await api.get<ApiResponse<AssignedForm[]>>('/forms', { params: { mine: true } });
    return extractData(res);
  },

  getMyResponse: async (id: number): Promise<MyFormResponse> => {
    const res = await api.get<ApiResponse<MyFormResponse>>(`/forms/${id}/my-responses`);
    return extractData(res);
  },

  // ── Sections ──────────────────────────────────────────────────────────
  createSection: async (formId: number, input: CreateSectionInput): Promise<FormSection> => {
    const res = await api.post<ApiResponse<FormSection>>(`/forms/${formId}/sections`, input);
    return extractData(res);
  },

  updateSection: async (id: number, input: UpdateSectionInput): Promise<FormSection> => {
    const res = await api.put<ApiResponse<FormSection>>(`/forms/sections/${id}`, input);
    return extractData(res);
  },

  deleteSection: async (id: number): Promise<void> => {
    await api.delete(`/forms/sections/${id}`);
  },

  reorderSections: async (formId: number, sectionIds: number[]): Promise<void> => {
    await api.post(`/forms/${formId}/sections/reorder`, { sectionIds });
  },

  // ── Questions ─────────────────────────────────────────────────────────
  createQuestion: async (formId: number, input: CreateQuestionInput): Promise<FormQuestion> => {
    const res = await api.post<ApiResponse<FormQuestion>>(`/forms/${formId}/questions`, input);
    return extractData(res);
  },

  updateQuestion: async (id: number, input: UpdateQuestionInput): Promise<FormQuestion> => {
    const res = await api.put<ApiResponse<FormQuestion>>(`/forms/questions/${id}`, input);
    return extractData(res);
  },

  deleteQuestion: async (id: number): Promise<void> => {
    await api.delete(`/forms/questions/${id}`);
  },

  reorderQuestions: async (formId: number, questionIds: number[], sectionId?: number | null): Promise<void> => {
    await api.post(`/forms/${formId}/questions/reorder`, { questionIds, sectionId });
  },

  // ── Logic rules ───────────────────────────────────────────────────────
  createLogicRule: async (formId: number, input: CreateLogicRuleInput): Promise<FormLogicRule> => {
    const res = await api.post<ApiResponse<FormLogicRule>>(`/forms/${formId}/logic-rules`, input);
    return extractData(res);
  },

  updateLogicRule: async (id: number, input: UpdateLogicRuleInput): Promise<FormLogicRule> => {
    const res = await api.put<ApiResponse<FormLogicRule>>(`/forms/logic-rules/${id}`, input);
    return extractData(res);
  },

  deleteLogicRule: async (id: number): Promise<void> => {
    await api.delete(`/forms/logic-rules/${id}`);
  },

  // ── Settings & theme ──────────────────────────────────────────────────
  getSettings: async (formId: number): Promise<FormSettings> => {
    const res = await api.get<ApiResponse<FormSettings>>(`/forms/${formId}/settings`);
    return extractData(res);
  },

  updateSettings: async (formId: number, patch: Partial<FormSettings>): Promise<FormSettings> => {
    const res = await api.put<ApiResponse<FormSettings>>(`/forms/${formId}/settings`, patch);
    return extractData(res);
  },

  getTheme: async (formId: number): Promise<FormTheme> => {
    const res = await api.get<ApiResponse<FormTheme>>(`/forms/${formId}/themes`);
    return extractData(res);
  },

  updateTheme: async (formId: number, patch: Partial<FormTheme>, headerImage?: File | null): Promise<FormTheme> => {
    if (headerImage) {
      const formData = new FormData();
      Object.entries(patch).forEach(([key, value]) => {
        if (value != null) formData.append(key, String(value));
      });
      formData.append('headerImage', headerImage);
      const res = await api.put<ApiResponse<FormTheme>>(`/forms/${formId}/themes`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return extractData(res);
    }
    const res = await api.put<ApiResponse<FormTheme>>(`/forms/${formId}/themes`, patch);
    return extractData(res);
  },

  // ── Analytics ─────────────────────────────────────────────────────────
  getAnalytics: async (formId: number): Promise<FormAnalytics> => {
    const res = await api.get<ApiResponse<FormAnalytics>>(`/forms/${formId}/analytics`);
    return extractData(res);
  },

  // ── Responses ─────────────────────────────────────────────────────────
  submitResponse: async (
    id: number,
    answers: FormAnswerInput[],
    files: Record<number, File>,
    final = true,
  ): Promise<void> => {
    const formData = new FormData();
    formData.append('answers', JSON.stringify(answers));
    formData.append('final', String(final));
    Object.entries(files).forEach(([questionId, file]) => formData.append(`question_${questionId}`, file));
    await api.post(`/forms/${id}/responses`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  listResponses: async (id: number): Promise<FormResponseWithAnswers[]> => {
    const res = await api.get<ApiResponse<FormResponseWithAnswers[]>>(`/forms/${id}/responses`);
    return extractData(res);
  },

  downloadResponses: async (id: number, format: 'csv' | 'xlsx' = 'xlsx'): Promise<Blob> => {
    const res = await api.get(`/forms/${id}/responses/export`, { params: { format }, responseType: 'blob' });
    return res.data as Blob;
  },
};
