// Uploaded files (e.g. /uploads/documents/...) are served from the API's
// origin, not from behind its /api or /api/vN prefix - strip that suffix so
// callers can build an absolute URL to a file from its relative upload path.
export const API_FILE_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api(\/v\d+)?\/?$/, '') || 'http://localhost:5000';

export const resolveFileUrl = (url: string): string => `${API_FILE_BASE_URL}${url}`;

// Step keys for the self-service profile wizard (app/(dashboard)/profile/wizard).
export const PROFILE_WIZARD_STEP_KEYS = {
  STATUTORY: 'statutory',
  REMITTANCE: 'remittance',
  DEPENDENTS: 'dependents',
  EMERGENCY: 'emergency',
  WELFARE: 'welfare',
  EDUCATION: 'education',
  WORK_HISTORY: 'workHistory',
} as const;

// Supporting-document uploads (e.g. NIC copy, address proof, certificates).
export const SUPPORTING_DOCUMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png,.doc,.docx';
export const SUPPORTING_DOCUMENT_MAX_SIZE_MB = 10;

// Document Vault uploads (OCD-495): narrower than SUPPORTING_DOCUMENT_ACCEPT -
// JPG, PNG, PDF, DOC, DOCX only. The mime types cover the file picker/drag-drop
// check in FileUpload.handleFiles; the .doc/.docx extensions are included as a
// fallback since some browsers/OSes report an empty or generic mime type for them.
export const DOCUMENT_VAULT_ACCEPT =
  'image/jpeg,image/png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.doc,.docx';
export const DOCUMENT_VAULT_ACCEPT_HINT = 'Supported file types: JPG, PNG, PDF, DOC, DOCX.';
export const DOCUMENT_VAULT_TYPE_ERROR = 'Invalid file type. Only JPG, PNG, PDF, DOC, and DOCX files are allowed.';

// date-fns format() patterns.
export const DATE_FORMATS = {
  /** e.g. "Mar 05" */
  SHORT: 'MMM dd',
  /** e.g. "Mar 05, 2026" */
  MEDIUM: 'MMM dd, yyyy',
} as const;
