import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  formService,
  type CreateFormInput,
  type CreateLogicRuleInput,
  type CreateQuestionInput,
  type CreateSectionInput,
  type UpdateFormInput,
  type UpdateLogicRuleInput,
  type UpdateQuestionInput,
  type UpdateSectionInput,
} from '@/lib/services/form.service';
import type { FormAnswerInput, FormSettings, FormTheme } from '@/types/hrModules';

export const useCreateFormMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateFormInput) => formService.create(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['forms', 'list'] });
    },
  });
};

export const useUpdateFormMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateFormInput }) => formService.update(id, input),
    onSuccess: (_data, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['forms', 'list'] });
      void queryClient.invalidateQueries({ queryKey: ['forms', 'detail', id] });
    },
  });
};

export const useDeleteFormMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => formService.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['forms', 'list'] });
    },
  });
};

export const useDuplicateFormMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => formService.duplicate(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['forms', 'list'] });
    },
  });
};

export const usePublishFormMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => formService.publish(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['forms', 'list'] });
    },
  });
};

export const useUnpublishFormMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => formService.unpublish(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['forms', 'list'] });
    },
  });
};

export const useArchiveFormMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => formService.archive(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['forms', 'list'] });
    },
  });
};

export const useDistributeFormMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userIds, groupIds, closeAt }: { id: number; userIds: number[]; groupIds: number[]; closeAt?: string | null }) =>
      formService.distribute(id, userIds, groupIds, closeAt),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['forms', 'list'] });
    },
  });
};

export const useSubmitFormResponseMutation = (formId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      answers,
      files,
      final = true,
    }: {
      answers: FormAnswerInput[];
      files: Record<number, File>;
      final?: boolean;
    }) => formService.submitResponse(formId, answers, files, final),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['forms', 'mine'] });
    },
  });
};

// ── Sections ───────────────────────────────────────────────────────────────

export const useCreateSectionMutation = (formId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSectionInput) => formService.createSection(formId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['forms', 'detail', formId] });
    },
  });
};

export const useUpdateSectionMutation = (formId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateSectionInput }) => formService.updateSection(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['forms', 'detail', formId] });
    },
  });
};

export const useDeleteSectionMutation = (formId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => formService.deleteSection(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['forms', 'detail', formId] });
    },
  });
};

export const useReorderSectionsMutation = (formId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sectionIds: number[]) => formService.reorderSections(formId, sectionIds),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['forms', 'detail', formId] });
    },
  });
};

// ── Questions ──────────────────────────────────────────────────────────────

export const useCreateQuestionMutation = (formId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateQuestionInput) => formService.createQuestion(formId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['forms', 'detail', formId] });
    },
  });
};

export const useUpdateQuestionMutation = (formId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateQuestionInput }) => formService.updateQuestion(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['forms', 'detail', formId] });
    },
  });
};

export const useDeleteQuestionMutation = (formId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => formService.deleteQuestion(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['forms', 'detail', formId] });
    },
  });
};

export const useReorderQuestionsMutation = (formId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questionIds, sectionId }: { questionIds: number[]; sectionId?: number | null }) =>
      formService.reorderQuestions(formId, questionIds, sectionId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['forms', 'detail', formId] });
    },
  });
};

// ── Logic rules ────────────────────────────────────────────────────────────

export const useCreateLogicRuleMutation = (formId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLogicRuleInput) => formService.createLogicRule(formId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['forms', 'detail', formId] });
    },
  });
};

export const useUpdateLogicRuleMutation = (formId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: UpdateLogicRuleInput }) => formService.updateLogicRule(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['forms', 'detail', formId] });
    },
  });
};

export const useDeleteLogicRuleMutation = (formId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => formService.deleteLogicRule(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['forms', 'detail', formId] });
    },
  });
};

// ── Settings & theme ──────────────────────────────────────────────────────

export const useUpdateFormSettingsMutation = (formId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<FormSettings>) => formService.updateSettings(formId, patch),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['forms', 'settings', formId] });
    },
  });
};

export const useUpdateFormThemeMutation = (formId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ patch, headerImage }: { patch: Partial<FormTheme>; headerImage?: File | null }) =>
      formService.updateTheme(formId, patch, headerImage),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['forms', 'theme', formId] });
    },
  });
};
