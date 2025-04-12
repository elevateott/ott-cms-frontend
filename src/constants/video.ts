export const VIDEO_SOURCE_TYPES = {
  MUX: 'mux',
  EMBEDDED: 'embedded',
} as const

export const VIDEO_STATUS_TYPES = {
  UPLOADING: 'uploading',
  PROCESSING: 'processing',
  READY: 'ready',
  ERROR: 'error',
} as const

export const VIDEO_STATUS_COLORS = {
  [VIDEO_STATUS_TYPES.UPLOADING]: 'bg-blue-100 text-blue-800',
  [VIDEO_STATUS_TYPES.PROCESSING]: 'bg-yellow-100 text-yellow-800',
  [VIDEO_STATUS_TYPES.READY]: 'bg-green-100 text-green-800',
  [VIDEO_STATUS_TYPES.ERROR]: 'bg-red-100 text-red-800',
} as const

export const VIDEO_VISIBILITY_TYPES = {
  PUBLIC: 'public',
  MEMBERS: 'members',
  PREMIUM: 'premium',
  PRIVATE: 'private',
} as const
