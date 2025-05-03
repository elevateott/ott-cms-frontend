/**
 * Check Collections Script
 * 
 * This script checks if the collections are properly registered in Payload CMS.
 */

import { exec } from 'child_process';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.development' });

// Run the payload CLI command to list collections
function runPayloadCommand() {
  console.log('Running payload command to list collections...');
  
  const command = 'npx payload collections:list';
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`Command stderr: ${stderr}`);
      return;
    }
    
    console.log('Collections found:');
    console.log(stdout);
    
    // Check if videoassets collection exists
    if (stdout.includes('videoassets')) {
      console.log('videoassets collection exists');
    } else {
      console.log('videoassets collection does not exist');
    }
  });
}

// Run the command
runPayloadCommand();
