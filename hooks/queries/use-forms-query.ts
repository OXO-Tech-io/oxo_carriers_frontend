import { useQuery } from '@tanstack/react-query';
import { formService } from '@/lib/services/form.service';

export const useFormsQuery = () =>
  useQuery({
    queryKey: ['forms', 'list'],
    queryFn: () => formService.list(),
  });

/** Full graph (form + sections + questions + options + logic rules) in one call. */
export const useFormQuery = (id: number) =>
  useQuery({
    queryKey: ['forms', 'detail', id],
    queryFn: () => formService.getById(id),
    enabled: !!id,
  });

export const useAssignedFormsQuery = () =>
  useQuery({
    queryKey: ['forms', 'mine'],
    queryFn: () => formService.listAssignedToMe(),
  });

export const useMyFormResponseQuery = (id: number) =>
  useQuery({
    queryKey: ['forms', 'my-response', id],
    queryFn: () => formService.getMyResponse(id),
    enabled: !!id,
  });

export const useFormResponsesQuery = (id: number) =>
  useQuery({
    queryKey: ['forms', 'responses', id],
    queryFn: () => formService.listResponses(id),
    enabled: !!id,
  });

export const useFormSettingsQuery = (id: number) =>
  useQuery({
    queryKey: ['forms', 'settings', id],
    queryFn: () => formService.getSettings(id),
    enabled: !!id,
  });

export const useFormThemeQuery = (id: number) =>
  useQuery({
    queryKey: ['forms', 'theme', id],
    queryFn: () => formService.getTheme(id),
    enabled: !!id,
  });

export const useFormAnalyticsQuery = (id: number) =>
  useQuery({
    queryKey: ['forms', 'analytics', id],
    queryFn: () => formService.getAnalytics(id),
    enabled: !!id,
  });
