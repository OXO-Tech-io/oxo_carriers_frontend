import { useQuery } from '@tanstack/react-query';
import { formService } from '@/lib/services/form.service';

export const useFormsQuery = () =>
  useQuery({
    queryKey: ['forms', 'list'],
    queryFn: () => formService.list(),
  });

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

export const useFormResponsesQuery = (id: number) =>
  useQuery({
    queryKey: ['forms', 'responses', id],
    queryFn: () => formService.listResponses(id),
    enabled: !!id,
  });
