/**
 * Test script to check for circular dependencies
 */

import { logger } from '../src/utils/logger.js';
import { config } from '../src/config/index.js';

console.log('Logger initialized:', logger !== undefined);
console.log('Config initialized:', config !== undefined);

console.log('Test completed successfully!');
