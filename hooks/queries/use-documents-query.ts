import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { documentService, type ListDocumentsParams } from '@/lib/services/document.service';

/** Admin "manage" view - one page of documents at a time, requires document_vault write. */
export const useManageDocumentsQuery = (params: ListDocumentsParams = {}, enabled = true) =>
  useQuery({
    queryKey: ['documents', 'manage', params.page ?? 1, params.pageSize ?? null],
    queryFn: () => documentService.listAll(params),
    enabled,
  });

/** Merged view for the current employee - powers /my-documents and the Profile "Document Vault" tab. */
export const useMyDocumentsQuery = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['documents', 'mine', user?.id ?? null],
    queryFn: () => documentService.listForEmployee(user!.id),
    enabled: Boolean(user?.id),
  });
};

/** Same merged view for one employee - powers the admin Document Vault modal on the Users page. */
export const useEmployeeDocumentsQuery = (employeeId: number, options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['documents', 'employee', employeeId],
    queryFn: () => documentService.listForEmployee(employeeId),
    enabled: options?.enabled ?? true,
  });
