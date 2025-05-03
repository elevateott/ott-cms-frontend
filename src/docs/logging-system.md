# Logging System Documentation

This document provides an overview of the logging system implemented in the OTT CMS Frontend application.

## Overview

The logging system is built on top of the [Pino](https://getpino.io/) library and provides:

1. Server-side structured logging
2. Client-side logging with server forwarding
3. Integration with Payload CMS hooks
4. Error handling integration

## Server-Side Logging

### Basic Usage

```typescript
import { logger, logInfo, logError, logWarning, logDebug } from '@/utils/logger';

// Direct logger usage
logger.info('Server started');
logger.error({ err: new Error('Database connection failed') }, 'Failed to connect to database');

// Helper functions with context
logInfo('User logged in', 'AuthService', { userId: '123' });
logError(new Error('Payment failed'), 'PaymentService', { orderId: '456' });
logWarning('Rate limit approaching', 'APIService', { endpoint: '/api/videos' });
logDebug('Processing request', 'RequestHandler', { requestId: '789' });
```

### Context Loggers

```typescript
import { createContextLogger } from '@/utils/logger';

// Create a logger for a specific context
const videoLogger = createContextLogger('VideoService');

videoLogger.info('Video uploaded', { videoId: '123' });
videoLogger.error(new Error('Transcoding failed'), { videoId: '123' });
```

## Client-Side Logging

### Basic Usage

```typescript
import { clientLogger } from '@/utils/clientLogger';

// Basic logging
clientLogger.info('Page loaded');
clientLogger.warn('Slow response time', 'PerformanceMonitor', { responseTime: 1500 });
clientLogger.error(new Error('Playback failed'), 'VideoPlayer', { videoId: '123' });
clientLogger.debug('Initializing component', 'VideoGrid');

// With context
clientLogger.info('User clicked button', 'UserInteraction', { buttonId: 'play-btn' });
```

### Context Loggers

```typescript
import { clientLogger } from '@/utils/clientLogger';

// Create a logger for a specific context
const playerLogger = clientLogger.createContextLogger('VideoPlayer');

playerLogger.info('Video started playing', { videoId: '123' });
playerLogger.error(new Error('Playback error'), { videoId: '123', errorCode: 'MEDIA_ERR_NETWORK' });
```

## Payload CMS Hooks

### Adding Logging to Collections

```typescript
import { createCollectionLoggingHooks } from '@/hooks/logging/payloadLoggingHooks';

export const Videos: CollectionConfig = {
  slug: 'videos',
  // ... other collection config
  hooks: {
    ...createCollectionLoggingHooks('videos'),
    // Add your other hooks here
  },
};
```

### Adding Logging to Globals

```typescript
import { createGlobalLoggingHooks } from '@/hooks/logging/payloadLoggingHooks';

export const StreamingSources: GlobalConfig = {
  slug: 'streaming-sources',
  // ... other global config
  hooks: {
    ...createGlobalLoggingHooks('streaming-sources'),
    // Add your other hooks here
  },
};
```

### Individual Hooks

```typescript
import {
  logBeforeChange,
  logAfterChange,
  logBeforeDelete,
  logAfterDelete
} from '@/hooks/logging/payloadLoggingHooks';

export const Videos: CollectionConfig = {
  slug: 'videos',
  // ... other collection config
  hooks: {
    beforeChange: [
      logBeforeChange('videos'),
      // Your other beforeChange hooks
    ],
    afterChange: [
      logAfterChange('videos'),
      // Your other afterChange hooks
    ],
    // ... other hooks
  },
};
```

## Error Handling Integration

```typescript
import { logError, handleError, AppError } from '@/utils/errorHandler';

try {
  // Some operation that might fail
} catch (error) {
  // Log the error with context and additional data
  logError(error, 'VideoProcessingService', { videoId: '123' });

  // Handle the error and get appropriate response data
  const errorInfo = handleError(error, 'VideoProcessingService');

  // Use the error info to create a response
  return {
    success: false,
    error: errorInfo.message,
    statusCode: errorInfo.statusCode,
  };
}
```

## Configuration

### Environment Variables

- `LOG_LEVEL`: Set the logging level (default: 'debug' in development, 'info' in production)
- `LOG_FILE`: Path to log file (default: './logs/app.log')
- `ENABLE_FILE_LOGGING`: Enable writing logs to a file in development ('true' or 'false')
- `NEXT_PUBLIC_ENABLE_REMOTE_LOGGING`: Enable client-side logs to be sent to the server ('true' or 'false')

### File Logging in Development

To enable file logging in development, you can:

1. Use the `dev:logs` script: `npm run dev:logs`
2. Or set the environment variable: `ENABLE_FILE_LOGGING=true npm run dev`

Logs will be written to the `./logs/app.log` file by default. You can customize the location by setting the `LOG_FILE` environment variable.

### Log Levels

- `fatal`: The service/app is going to stop or become unusable. An operator should definitely look into this.
- `error`: Fatal for a particular request, but the service/app continues servicing other requests.
- `warn`: A note of a potential problem, or a handled edge case.
- `info`: Detail on regular operation.
- `debug`: Anything else, like queries, responses, etc.
- `trace`: Very detailed application logging.

## Best Practices

1. **Use Context**: Always provide a context to make logs easier to filter and understand.
2. **Structured Data**: Include relevant structured data with logs rather than concatenating strings.
3. **Error Objects**: Pass Error objects directly to logError rather than just the message.
4. **Sensitive Data**: Never log sensitive data like passwords, tokens, or personal information.
5. **Performance**: Be mindful of the performance impact of excessive logging in production.
