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
  RELOAD_PAGE: 'reload:page',

  // UI events
  MODAL_OPEN: 'modal:open',
  MODAL_CLOSE: 'modal:close',
  NOTIFICATION: 'notification',

  // Navigation events
  NAVIGATION_START: 'navigation:start',
  NAVIGATION_END: 'navigation:end',
} as const


