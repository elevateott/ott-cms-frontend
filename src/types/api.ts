/**
 * Type definitions for API responses
 */

// Basic API response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Paginated response from Payload CMS
export interface PaginatedResponse<T> extends ApiResponse<{
  docs: T[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}> {}

// Error response
export interface ApiErrorResponse {
  success: false;
  error: string;
  statusCode?: number;
}

// Authentication related responses
export interface AuthResponse extends ApiResponse<{
  user: {
    id: string;
    email: string;
    [key: string]: any;
  };
  token?: string;
}> {}

// File upload response
export interface FileUploadResponse extends ApiResponse<{
  file: {
    id: string;
    url: string;
    filename: string;
    mimeType: string;
    filesize: number;
  };
}> {}
