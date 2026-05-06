export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: unknown;
}

export interface ApiErrorBody {
  success: false;
  message: string;
  errors?: Array<{ path: string; message: string }>;
  error?: string;
}
