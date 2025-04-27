// scripts/generate-types-fix.js
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Create a temporary file that exports an empty module for CSS files
const tempFile = path.resolve('./temp-css-module.js');
fs.writeFileSync(tempFile, 'export default {}');

// Create a temporary directory for node_modules symlinks
const tempDir = path.resolve('./temp-node-modules');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Create a symlink to the problematic CSS file
const cssDir = path.resolve(tempDir, 'react-image-crop', 'dist');
if (!fs.existsSync(cssDir)) {
  fs.mkdirSync(cssDir, { recursive: true });
}

const cssFile = path.resolve(cssDir, 'ReactCrop.css');
fs.writeFileSync(cssFile, '/* Empty CSS file */');

try {
  // Run the generate:types command
  console.log('Generating Payload types...');
  execSync('cross-env NODE_OPTIONS=--no-deprecation payload generate:types', {
    stdio: 'inherit'
  });
  console.log('Types generated successfully!');
} catch (error) {
  console.error('Error generating types:', error);
  process.exit(1);
} finally {
  // Clean up temporary files
  if (fs.existsSync(tempFile)) {
    fs.unlinkSync(tempFile);
  }
  
  // We'll leave the temp directory for now as it might be needed for future runs
}
