// Uploaded files (e.g. /uploads/documents/...) are served from the API's
// origin, not from behind its /api or /api/vN prefix - strip that suffix so
// callers can build an absolute URL to a file from its relative upload path.
export const API_FILE_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api(\/v\d+)?\/?$/, '') || 'http://localhost:5000';

export const resolveFileUrl = (url: string): string => `${API_FILE_BASE_URL}${url}`;
