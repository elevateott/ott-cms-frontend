export const EVENTS = {
  // Video events
  VIDEO_UPDATED: 'video:updated',
  VIDEO_CREATED: 'video:created',
  VIDEO_DELETED: 'video:deleted',
  VIDEO_UPLOAD_STARTED: 'video:upload:started',
  VIDEO_UPLOAD_PROGRESS: 'video:upload:progress',
  VIDEO_UPLOAD_COMPLETED: 'video:upload:completed',
  VIDEO_UPLOAD_ERROR: 'video:upload:error',
  VIDEO_STATUS_READY: 'video:status:ready',
  VIDEO_STATUS_UPDATED: 'video:status:updated',
  VIDEO_LIST_REFRESH: 'video:list:refresh',

  // Live Stream events
  LIVE_STREAM_CREATED: 'live:stream:created',
  LIVE_STREAM_UPDATED: 'live:stream:updated',
  LIVE_STREAM_DELETED: 'live:stream:deleted',
  LIVE_STREAM_ACTIVE: 'live:stream:active',
  LIVE_STREAM_IDLE: 'live:stream:idle',
  LIVE_STREAM_DISCONNECTED: 'live:stream:disconnected',
  LIVE_STREAM_RECORDING: 'live:stream:recording',
  LIVE_STREAM_STATUS_UPDATED: 'live:stream:status:updated',

  // Simulcast events
  LIVE_STREAM_SIMULCAST_UPDATED: 'live:stream:simulcast:updated',
  LIVE_STREAM_SIMULCAST_CONNECTED: 'live:stream:simulcast:connected',
  LIVE_STREAM_SIMULCAST_DISCONNECTED: 'live:stream:simulcast:disconnected',
  LIVE_STREAM_SIMULCAST_ERROR: 'live:stream:simulcast:error',

  // Recording events
  RECORDING_CREATED: 'recording:created',
  RECORDING_READY: 'recording:ready',
  RECORDING_UPDATED: 'recording:updated',

  // UI events
  MODAL_OPEN: 'modal:open',
  MODAL_CLOSE: 'modal:close',
  NOTIFICATION: 'notification',

  // Navigation events
  NAVIGATION_START: 'navigation:start',
  NAVIGATION_END: 'navigation:end',
} as const
