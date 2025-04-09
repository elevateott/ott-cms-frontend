/**
 * Type definitions for React components
 */
import { ReactNode } from 'react';
import { VideoDocument } from './mux';

// Common props
export interface BaseProps {
  className?: string;
  id?: string;
  style?: React.CSSProperties;
}

export interface ChildrenProps {
  children?: ReactNode;
}

// Button props
export interface ButtonProps extends BaseProps {
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'text' | 'danger';
  size?: 'small' | 'medium' | 'large';
  isLoading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  children: ReactNode;
}

// Input props
export interface InputProps extends BaseProps {
  name: string;
  label?: string;
  type?: string;
  value?: string;
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
}

// Select props
export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps extends BaseProps {
  name: string;
  label?: string;
  options: SelectOption[];
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLSelectElement>) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
}

// Video uploader props
export interface VideoUploaderProps extends BaseProps {
  refreshList: () => void;
}

// Video list props
export interface VideoListProps extends BaseProps {
  refreshTrigger: number;
  limit?: number;
  sort?: string;
}

// Video item props
export interface VideoItemProps extends BaseProps {
  video: VideoDocument;
  onEdit?: (id: string) => void;
}

// Video player props
export interface VideoPlayerProps extends BaseProps {
  playbackId?: string;
  poster?: string;
  aspectRatio?: string;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  preload?: 'auto' | 'metadata' | 'none';
}

// Modal props
export interface ModalProps extends BaseProps, ChildrenProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'full';
}

// Form props
export interface FormProps extends BaseProps, ChildrenProps {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
}

// Card props
export interface CardProps extends BaseProps, ChildrenProps {
  title?: string;
  subtitle?: string;
  image?: string;
  footer?: ReactNode;
  onClick?: () => void;
  hoverable?: boolean;
}

// Alert props
export interface AlertProps extends BaseProps, ChildrenProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

// Pagination props
export interface PaginationProps extends BaseProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  siblingCount?: number;
}
