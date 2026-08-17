import api from '@/lib/api';
import { extractData } from '@/lib/services/http';
import type { ApiResponse } from '@/types/api';
import type { DocumentTargetType, VaultDocument } from '@/types/hrModules';

export interface CreateDocumentInput {
  title: string;
  description?: string;
  targetType: DocumentTargetType;
  individualEmployeeIds: number[];
  files: File[];
}

export const documentService = {
  create: async (input: CreateDocumentInput): Promise<VaultDocument> => {
    const formData = new FormData();
    formData.append('title', input.title);
    if (input.description) formData.append('description', input.description);
    formData.append('targetType', input.targetType);
    if (input.targetType === 'individual') {
      formData.append('individualEmployeeIds', JSON.stringify(input.individualEmployeeIds));
    }
    input.files.forEach((file) => formData.append('document', file));
    const res = await api.post<ApiResponse<VaultDocument>>('/document-vaults', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return extractData(res);
  },

  /** Admin "manage" view - every document, requires document_vault write. */
  listAll: async (): Promise<VaultDocument[]> => {
    const res = await api.get<ApiResponse<VaultDocument[]>>('/documents');
    return extractData(res);
  },

  /**
   * Merged view (individually-targeted + 'All Employees' documents) for one employee.
   * Own documents need no special permission; the backend requires document_vault
   * write to fetch another employee's.
   */
  listForEmployee: async (employeeId: number): Promise<VaultDocument[]> => {
    const res = await api.get<ApiResponse<VaultDocument[]>>(`/employees/${employeeId}/documents`);
    return extractData(res);
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/document-vaults/${id}`);
  },
};
