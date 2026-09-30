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
  SUPPORTING_INFO: 'supportingInfo',
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
  /** e.g. "Mar 5, 2026" - no leading zero on the day */
  COMPACT: 'MMM d, yyyy',
  /** e.g. "Mar 05, 2026, 3:45 PM" */
  MEDIUM_WITH_TIME: 'MMM dd, yyyy, h:mm a',
  /** e.g. "Mar 5, 2026 3:45 PM" */
  COMPACT_WITH_TIME: 'MMM d, yyyy h:mm a',
  /** e.g. "March 05, 2026" */
  LONG: 'MMMM dd, yyyy',
  /** e.g. "March 2026" */
  MONTH_YEAR: 'MMMM yyyy',
  /** e.g. "Mar 2026" */
  SHORT_MONTH_YEAR: 'MMM yyyy',
  /** ISO date, e.g. "2026-03-05" - API params / date input values */
  ISO_DATE: 'yyyy-MM-dd',
  /** datetime-local input value, e.g. "2026-03-05T15:45" */
  DATETIME_LOCAL_INPUT: "yyyy-MM-dd'T'HH:mm",
  /** Day of month only, e.g. "5" - calendar grid cells */
  DAY_ONLY: 'd',
  /** Weekday abbreviation, e.g. "Mon" */
  WEEKDAY_SHORT: 'EEE',
  /** 24-hour time, e.g. "15:45" */
  TIME_24H: 'HH:mm',
  /** 12-hour time with leading zero, e.g. "03:45 PM" */
  TIME_12H: 'hh:mm a',
  /** 12-hour time without leading zero, e.g. "3:45 PM" */
  TIME_12H_NO_PAD: 'h:mm a',
} as const;
