/**
 * Application Constants
 * 
 * This module provides constants used throughout the application.
 */

// Video source types
export const VIDEO_SOURCE_TYPES = {
  MUX: 'mux',
  EMBEDDED: 'embedded',
} as const;

// Video status types
export const VIDEO_STATUS_TYPES = {
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  READY: 'ready',
  ERROR: 'error',
} as const;

// Video visibility types
export const VIDEO_VISIBILITY_TYPES = {
  PUBLIC: 'public',
  MEMBERS: 'members',
  PREMIUM: 'premium',
  PRIVATE: 'private',
} as const;

// Mux webhook event types
export const MUX_WEBHOOK_EVENT_TYPES = {
  ASSET_CREATED: 'video.asset.created',
  ASSET_READY: 'video.asset.ready',
  ASSET_ERRORED: 'video.asset.errored',
  UPLOAD_CREATED: 'video.upload.created',
  UPLOAD_ASSET_CREATED: 'video.upload.asset_created',
  ASSET_NON_STANDARD_INPUT: 'video.asset.non_standard_input_detected',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  VIDEOS: '/api/videos',
  MUX_DIRECT_UPLOAD: '/api/mux/direct-upload',
  MUX_WEBHOOK: '/api/mux/webhook',
  MUX_CREATE_VIDEO: '/api/mux/create-video',
  EVENTS: '/api/events',
} as const;

// Event types
export const EVENT_TYPES = {
  VIDEO_CREATED: 'video_created',
  VIDEO_UPDATED: 'video_updated',
  CONNECTED: 'connected',
} as const;

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// Image dimensions
export const IMAGE_DIMENSIONS = {
  THUMBNAIL: {
    WIDTH: 640,
    HEIGHT: 360,
  },
  PREVIEW: {
    WIDTH: 1280,
    HEIGHT: 720,
  },
} as const;

// Time constants
export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER: 'user',
  THEME: 'theme',
} as const;
