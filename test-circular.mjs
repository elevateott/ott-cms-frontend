/**
 * Test script to check for circular dependencies
 */

// Try importing the modules
(async () => {
  try {
    // Use dynamic imports
    const loggerModule = await import('./src/utils/logger.js');
    console.log('Logger imported successfully');
    
    const configModule = await import('./src/config/index.js');
    console.log('Config imported successfully');
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error importing modules:', error);
  }
})();
