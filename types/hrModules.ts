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

export interface CommunicationRecipientDetail {
  id: number;
  userId: number;
  name: string;
  email: string;
  emailSentAt: string | null;
  respondedAt: string | null;
  responseText: string | null;
  isAcknowledged: boolean;
  isOnTime: boolean;
  isLate: boolean;
}

export interface Communication {
  id: number;
  title: string;
  body: string;
  requiresAcknowledgement: boolean;
  deadlineAt: string | null;
  createdBy: number | null;
  createdAt: string;
  totalRecipients?: number;
  acknowledgedCount?: number;
  onTimeCount?: number;
  lateCount?: number;
  pendingCount?: number;
  recipients?: CommunicationRecipientDetail[];
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
  requiresAcknowledgement?: boolean;
  deadlineAt?: string | null;
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

// ─── Form Creation (Google-Forms-style builder) ────────────────────────────
//
// Replaces the old 4-field-type/no-sections model. 19 question types, optional
// sections (page-break-style groupings), conditional visibility logic, minimal
// per-form theming, and response analytics. Distribution stays this app's own
// (HR assigns to specific employees/groups; no public links/anonymous/passwords).

export type FormQuestionType =
  | 'short_answer'
  | 'paragraph'
  | 'multiple_choice'
  | 'checkboxes'
  | 'dropdown'
  | 'file_upload'
  | 'linear_scale'
  | 'multiple_choice_grid'
  | 'checkbox_grid'
  | 'rating'
  | 'date'
  | 'time'
  | 'datetime'
  | 'yes_no'
  | 'email'
  | 'number'
  | 'url'
  | 'section_header'
  | 'rich_text';

export type FormStatus = 'draft' | 'published' | 'closed' | 'archived';

export type FormLogicComparator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'is_not_empty';

export type FormLogicAction = 'show' | 'hide';
export type FormLogicCombinator = 'all' | 'any';

export interface HrForm {
  id: number;
  title: string;
  description: string | null;
  status: FormStatus;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  archivedAt: string | null;
  responseCount: number;
  lastResponseAt: string | null;
  closeAt?: string | null;
}

export interface FormSection {
  id: number;
  formId: number;
  title: string;
  description: string | null;
  orderIndex: number;
}

export interface FormQuestionOption {
  id: number;
  questionId: number;
  label: string;
  value: string;
  orderIndex: number;
  isOther: boolean;
}

/** Per-type validation/config bag — shape varies by `type` (see components/forms/questionTypes.ts). */
export type FormQuestionConfig = Record<string, unknown>;

export interface FormQuestion {
  id: number;
  formId: number;
  sectionId: number | null;
  type: FormQuestionType;
  title: string;
  description: string | null;
  helpText: string | null;
  placeholder: string | null;
  required: boolean;
  orderIndex: number;
  config: FormQuestionConfig;
  defaultValue: unknown;
  options: FormQuestionOption[];
}

export interface FormLogicRule {
  id: number;
  formId: number;
  targetQuestionId: number;
  sourceQuestionId: number;
  comparator: FormLogicComparator;
  comparisonValue: unknown;
  action: FormLogicAction;
  combinator: FormLogicCombinator;
  orderIndex: number;
}

export interface FormSettings {
  formId: number;
  thankYouMessage: string | null;
  acceptResponses: boolean;
  closeAt: string | null;
  responseLimit: number | null;
  allowEditAfterSubmit: boolean;
  notifyOwnerOnResponse: boolean;
  notifyRespondent: boolean;
}

/** Minimal theme (internal HR tool, not a public form product) — see plan simplifications. */
export interface FormTheme {
  formId: number;
  primaryColor: string | null;
  headerImageUrl: string | null;
}

/** The combined graph returned by `GET /forms/:id` — form + sections + questions(+options) + logic rules. */
export interface FormWithGraph {
  form: HrForm;
  sections: FormSection[];
  questions: FormQuestion[];
  logicRules: FormLogicRule[];
}

export interface AssignedForm {
  form: HrForm;
  distributedAt: string | null;
  submitted: boolean;
  /** Mirrors FormSettings.acceptResponses, flattened onto the assignment so `/forms/mine` doesn't
   * need a settings fan-out per form. Absent (older payloads) is treated as accepting responses. */
  acceptResponses?: boolean;
  closeAt?: string | null;
}

export type FormResponseStatus = 'in_progress' | 'submitted';

export interface FormResponse {
  id: number;
  formId: number;
  userId: number;
  status: FormResponseStatus;
  startedAt: string | null;
  submittedAt: string | null;
  completionMs: number | null;
}

/** `value` is the structured answer (string/string[]/number/{row:col}...), `valueText` a flattened
 * version used for CSV/analytics/search display. */
export interface FormResponseAnswer {
  id: number;
  responseId: number;
  questionId: number;
  value: unknown;
  valueText: string | null;
}

// Shape of `UserModel.findById`'s result as returned by GET /forms/:id/responses - camelCase,
// unlike `EmployeeSummary` (which mirrors a different, snake_case-returning endpoint).
export interface FormResponseUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface FormResponseWithAnswers {
  response: FormResponse;
  answers: FormResponseAnswer[];
  user: FormResponseUser | null;
}

export interface MyFormResponse {
  response: FormResponse | null;
  answers: FormResponseAnswer[];
  allowEditAfterSubmit: boolean;
}

export interface FormAnswerInput {
  questionId: number;
  value?: unknown;
}

export interface FormQuestionAnalytics {
  questionId: number;
  title: string;
  type: FormQuestionType;
  responseCount: number;
  distribution?: { label: string; count: number }[];
  average?: number;
}

export interface FormAnalytics {
  totalResponses: number;
  totalStarted: number;
  completionRate: number;
  avgCompletionMs: number;
  trend: { date: string; count: number }[];
  perQuestion: FormQuestionAnalytics[];
}

// ─── Groups ─────────────────────────────────────────────────────────────────

export interface Group {
  id: number;
  name: string;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
  memberCount: number;
}

export interface GroupMemberSummary {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  addedAt: string | null;
}

export interface GroupWithMembers {
  group: Group;
  members: GroupMemberSummary[];
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
