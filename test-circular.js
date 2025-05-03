/**
 * Test script to check for circular dependencies
 */

// Try importing the modules
try {
  // Use require instead of import for simplicity
  const logger = require('./src/utils/logger');
  console.log('Logger imported successfully');
  
  const config = require('./src/config');
  console.log('Config imported successfully');
  
  console.log('Test completed successfully!');
} catch (error) {
  console.error('Error importing modules:', error);
}
