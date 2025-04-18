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
   
  // UI events
  MODAL_OPEN: 'modal:open',
  MODAL_CLOSE: 'modal:close',
  NOTIFICATION: 'notification',
  REFRESH_LIST_VIEW: 'refresh:list:view',

  // Navigation events
  NAVIGATION_START: 'navigation:start',
  NAVIGATION_END: 'navigation:end',
} as const

export const MUX_WEBHOOK_EVENT_TYPES = {
  ASSET_CREATED: 'video.asset.created',
  ASSET_READY: 'video.asset.ready',
  UPLOAD_ASSET_CREATED: 'video.upload.asset_created',
  NON_STANDARD_INPUT_DETECTED: 'video.asset.non_standard_input_detected',
} as const
