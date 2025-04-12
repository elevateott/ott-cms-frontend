export * from './api';
export * from './events';
export * from './video';

// Other constants that don't fit in specific categories
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

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

export const TIME = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  USER: 'user',
  THEME: 'theme',
} as const;

