# Console.log Replacement Strategy

This document outlines the strategy for replacing console.log statements with the new logging system using Pino.

## Overview

The project has a large number of console.log statements that need to be replaced with the new structured logging system. This document provides guidelines and examples for making these replacements.

## Replacement Patterns

### Server-Side Logging

Replace console.log statements with logger.info:

```typescript
// Before
console.log(`Starting server on port ${port}`)

// After
import { logger } from '@/utils/logger'
logger.info({ context: 'Server', port }, 'Starting server')
```

Replace console.error statements with logger.error:

```typescript
// Before
console.error(`Error connecting to database:`, error)

// After
import { logger } from '@/utils/logger'
logger.error({ context: 'Database', error }, 'Error connecting to database')
```

### Client-Side Logging

Replace console.log statements with clientLogger.info:

```typescript
// Before
console.log(`User clicked button:`, buttonId)

// After
import { clientLogger } from '@/utils/clientLogger'
clientLogger.info(`User clicked button`, 'UserInteraction', { buttonId })
```

Replace console.error statements with clientLogger.error:

```typescript
// Before
console.error(`Failed to load video:`, error)

// After
import { clientLogger } from '@/utils/clientLogger'
clientLogger.error(`Failed to load video`, 'VideoPlayer', { error })
```

## Context Guidelines

When adding context to log statements, use the following guidelines:

1. Use PascalCase for context names
2. Use specific, descriptive contexts
3. For components, use the component name
4. For services, use the service name
5. For hooks, use the hook name without the 'use' prefix

Examples:

- 'VideoPlayer'
- 'AuthService'
- 'EventBus'
- 'ApiClient'

## Log Level Guidelines

Use the appropriate log level for each message:

- **error**: Use for errors that affect functionality
- **warn**: Use for potential issues or edge cases
- **info**: Use for normal operation information
- **debug**: Use for detailed debugging information

## Structured Data Guidelines

When adding structured data to log statements:

1. Include relevant context data as separate fields
2. For errors, pass the entire error object
3. Use descriptive field names
4. Avoid logging sensitive information

## Scripts

Two scripts are provided to help with the replacement process:

1. `scripts/analyze-console-logs.js`: Analyzes the current console.log usage in the project
2. `scripts/replace-console-logs.js`: Helps replace console.log statements with the new logging system

### Running the Analysis Script

```bash
node scripts/analyze-console-logs.js
```

This will generate a report at `scripts/console-log-report.md` with information about console.log usage in the project.

### Analysis Results

The analysis script has identified:

- 331 console.log occurrences across 49 files
- 123 console.error occurrences across 56 files
- 13 console.warn occurrences across 9 files

The files with the most console.log statements are:

1. services/mux/videoAssetWebhookHandler.ts (66 occurrences)
2. services/mux/muxService.ts (48 occurrences)
3. app/(payload)/admin/payload-debug/page.tsx (18 occurrences)

### Running the Replacement Script

```bash
# Dry run (no changes)
node scripts/replace-console-logs.js

# Make actual changes
# Edit the script and set DRY_RUN = false
node scripts/replace-console-logs.js
```

This will replace console.log statements with the new logging system and generate a report at `scripts/console-log-replacement-report.md`.

### Replacement Results

The replacement script has identified 413 potential replacements across 69 files.

The files with the most replacements are:

1. services/mux/videoAssetWebhookHandler.ts (67 replacements)
2. services/mux/muxService.ts (57 replacements)
3. app/(payload)/admin/payload-debug/page.tsx (26 replacements)

## Manual Replacement

For complex cases, manual replacement is recommended. Follow these steps:

1. Identify the appropriate context for the log statement
2. Determine the appropriate log level
3. Extract relevant structured data
4. Replace the console.log statement with the appropriate logger call

## Testing

After replacing console.log statements, test the application to ensure:

1. All log statements are working correctly
2. No errors are introduced
3. Log levels are appropriate
4. Structured data is correctly formatted

## Monitoring

After deployment, monitor the logs to ensure:

1. Log volume is appropriate
2. Log levels are correctly set
3. Structured data is useful for debugging
4. No sensitive information is being logged
