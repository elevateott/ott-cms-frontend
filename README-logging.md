# OTT CMS Frontend Logging System

This document provides an overview of the logging system implemented in the OTT CMS Frontend application.

## Overview

The logging system is built on top of the [Pino](https://getpino.io/) library and provides:

1. Server-side structured logging
2. Client-side logging with server forwarding
3. Integration with Payload CMS hooks
4. Error handling integration

## Key Features

- **Structured Logging**: All logs are structured JSON objects, making them easy to parse and analyze
- **Context Support**: Every log can include a context to help identify the source
- **Environment-Aware**: Different log formats and levels based on the environment
- **Client-Side Integration**: Browser logs can be forwarded to the server
- **Payload CMS Integration**: Automatic logging of Payload CMS operations

## Configuration

### Environment Variables

- `LOG_LEVEL`: Set the logging level (default: 'debug' in development, 'info' in production)
- `LOG_FILE`: Path to log file (default: './logs/app.log')
- `ENABLE_FILE_LOGGING`: Enable writing logs to a file in development ('true' or 'false')
- `NEXT_PUBLIC_ENABLE_REMOTE_LOGGING`: Enable client-side logs to be sent to the server ('true' or 'false')

## Components

### Server-Side Logging

The server-side logging is implemented in `src/utils/logger.ts` and provides:

- A configured Pino logger instance
- Helper functions for different log levels
- Context-specific loggers
- File logging in both development and production

#### File Logging in Development

To enable file logging in development, you can:

1. Use the `dev:logs` script: `npm run dev:logs`
2. Or set the environment variable: `ENABLE_FILE_LOGGING=true npm run dev`

Logs will be written to the `./logs/app.log` file by default. You can customize the location by setting the `LOG_FILE` environment variable.

### Client-Side Logging

The client-side logging is implemented in `src/utils/clientLogger.ts` and provides:

- Console logging with formatted output
- Optional server forwarding
- Browser-specific context (user agent, URL)
- Error object handling

### API Route for Client Logs

The API route for receiving client logs is implemented in `src/app/api/log/client/route.ts`.

### Payload CMS Hooks

Logging hooks for Payload CMS are implemented in `src/hooks/logging/payloadLoggingHooks.ts`.

### Error Handling Integration

The error handling utilities are integrated with the logger in `src/utils/errorHandler.ts`.

## Usage Examples

See the detailed documentation in `src/docs/logging-system.md` for usage examples.

## Best Practices

1. **Use Context**: Always provide a context to make logs easier to filter and understand.
2. **Structured Data**: Include relevant structured data with logs rather than concatenating strings.
3. **Error Objects**: Pass Error objects directly to logError rather than just the message.
4. **Sensitive Data**: Never log sensitive data like passwords, tokens, or personal information.
5. **Performance**: Be mindful of the performance impact of excessive logging in production.

## Log Levels

- `fatal`: The service/app is going to stop or become unusable. An operator should definitely look into this.
- `error`: Fatal for a particular request, but the service/app continues servicing other requests.
- `warn`: A note of a potential problem, or a handled edge case.
- `info`: Detail on regular operation.
- `debug`: Anything else, like queries, responses, etc.
- `trace`: Very detailed application logging.

## Future Enhancements

- Integration with log aggregation services (Logtail, Datadog, etc.)
- Log rotation and compression for production
- User activity tracking
- Performance monitoring
