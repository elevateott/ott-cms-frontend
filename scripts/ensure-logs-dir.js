/**
 * Script to ensure the logs directory exists
 * 
 * This script creates the logs directory if it doesn't exist.
 * It's meant to be run before starting the application.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the logs directory (relative to the project root)
const logsDir = path.resolve(__dirname, '../logs');

// Create the logs directory if it doesn't exist
if (!fs.existsSync(logsDir)) {
  console.log(`Creating logs directory at ${logsDir}`);
  fs.mkdirSync(logsDir, { recursive: true });
} else {
  console.log(`Logs directory already exists at ${logsDir}`);
}

// Create a .gitignore file in the logs directory to ignore log files
const gitignorePath = path.join(logsDir, '.gitignore');
if (!fs.existsSync(gitignorePath)) {
  console.log('Creating .gitignore file in logs directory');
  fs.writeFileSync(gitignorePath, '# Ignore all files in this directory\n*\n# Except this file\n!.gitignore\n');
}

console.log('Logs directory setup complete');
