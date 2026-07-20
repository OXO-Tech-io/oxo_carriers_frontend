// Types for the 5 HR modules (Notes, Communications, Events, Forms, Work
// Logs). Mirror the backend endpoints' raw camelCase JSON shape directly, no
// mapper needed - same convention as types/profile.ts.

export interface Attachment {
  id: number;
  entityType: string;
  entityId: number;
  fileUrl: string;
  fileName: string;
  mimeType: string | null;
  fileSize: number | null;
  uploadedBy: number | null;
  createdAt: string;
}

export interface EmployeeSummary {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  employee_id?: string | null;
  department?: string | null;
  role?: string;
}

// ─── Employee Notes ─────────────────────────────────────────────────────────

export interface EmployeeNote {
  id: number;
  employeeUserId: number;
  authorUserId: number | null;
  content: string;
  createdAt: string;
  updatedAt: string;
  attachments?: Attachment[];
}

// ─── Communication Management ──────────────────────────────────────────────

export interface Communication {
  id: number;
  title: string;
  body: string;
  createdBy: number | null;
  createdAt: string;
}

export interface CommunicationRecipient {
  id: number;
  communicationId: number;
  userId: number;
  emailSentAt: string | null;
  respondedAt: string | null;
  responseText: string | null;
  title: string;
  body: string;
  createdAt: string;
}

// ─── Event Participation ────────────────────────────────────────────────────

export interface HrEvent {
  id: number;
  name: string;
  description: string | null;
  eventDate: string;
  location: string | null;
  createdBy: number | null;
  createdAt: string;
}

export interface EventParticipant {
  id: number;
  eventId: number;
  userId: number;
  participated: boolean;
  /** Stated intention ahead of the event, separate from the actual `participated` outcome. null = no response. */
  willParticipate: boolean | null;
  recordedBy: number | null;
  recordedAt: string | null;
}

// ─── Form Creation ──────────────────────────────────────────────────────────

export type FormFieldType = 'text' | 'radio' | 'select' | 'file';
export type FormStatus = 'draft' | 'published';

export interface HrForm {
  id: number;
  title: string;
  description: string | null;
  status: FormStatus;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface FormField {
  id: number;
  formId: number;
  label: string;
  fieldType: FormFieldType;
  options: string[] | null;
  required: boolean;
  orderIndex: number;
}

export interface FormFieldDraft {
  label: string;
  fieldType: FormFieldType;
  options?: string[];
  required: boolean;
  orderIndex: number;
}

export interface AssignedForm {
  form: HrForm;
  distributedAt: string | null;
  submitted: boolean;
}

export interface FormResponse {
  id: number;
  formId: number;
  userId: number;
  submittedAt: string;
}

export interface FormResponseAnswer {
  id: number;
  responseId: number;
  fieldId: number;
  valueText: string | null;
}

export interface FormResponseWithAnswers {
  response: FormResponse;
  answers: FormResponseAnswer[];
  user: EmployeeSummary | null;
}

// ─── Work Log ────────────────────────────────────────────────────────────────

export interface WorkLog {
  id: number;
  userId: number;
  workDate: string;
  taskDescription: string;
  hoursSpent: string;
  remarks: string | null;
  createdAt: string;
}

export interface WorkLogEntryDraft {
  workDate: string;
  taskDescription: string;
  hoursSpent: number;
  remarks?: string;
}

export interface BulkUploadResult {
  success: number;
  failed: number;
  errors: string[];
}

export interface WorkLogUserSummary {
  userId: number;
  employeeId: string | null;
  firstName: string;
  lastName: string;
  totalHours: number;
  entryCount: number;
}
