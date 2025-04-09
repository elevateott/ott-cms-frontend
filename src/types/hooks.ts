/**
 * Type definitions for custom hooks
 */

import { VideoDocument } from './mux';

// useVideoUpload types
export interface UseVideoUploadOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export interface UseVideoUploadResult {
  isUploading: boolean;
  progress: number;
  error: Error | null;
  uploadStatus: 'idle' | 'uploading' | 'processing' | 'ready' | 'error';
  getUploadUrl: (file?: File) => Promise<string | null>;
  handleProgress: (progress: number) => void;
  handleSuccess: (data: any) => void;
  handleError: (error: Error) => void;
  reset: () => void;
}

// useVideoList types
export interface UseVideoListOptions {
  limit?: number;
  sort?: string;
  initialRefresh?: boolean;
}

export interface UseVideoListResult {
  videos: VideoDocument[];
  loading: boolean;
  error: Error | null;
  refreshList: () => void;
}

// useEventSource types
export interface UseEventSourceOptions {
  url: string;
  events: Record<string, (data: any) => void>;
  onOpen?: () => void;
  onError?: (error: Event) => void;
}

export interface UseEventSourceResult {
  connected: boolean;
  error: Event | null;
  reconnect: () => void;
  close: () => void;
}

// useDebounce types
export interface UseDebounceOptions {
  delay?: number;
  leading?: boolean;
}

// useLocalStorage types
export interface UseLocalStorageOptions<T> {
  serializer?: (value: T) => string;
  deserializer?: (value: string) => T;
}

// usePagination types
export interface UsePaginationOptions {
  totalItems: number;
  initialPage?: number;
  initialLimit?: number;
  maxLimit?: number;
}

export interface UsePaginationResult {
  page: number;
  limit: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  pageItems: number[];
}

// useForm types
export interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => void | Promise<void>;
  validate?: (values: T) => Partial<Record<keyof T, string>>;
}

export interface UseFormResult<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isSubmitting: boolean;
  isValid: boolean;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  setFieldTouched: (field: keyof T, touched: boolean) => void;
  resetForm: () => void;
}
