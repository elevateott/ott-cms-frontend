// scripts/generate-types-workaround.js
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Create a temporary file that will be used to mock the CSS import
const cssModulePath = path.resolve(rootDir, 'node_modules', 'react-image-crop', 'dist', 'ReactCrop.css');
const cssJsModulePath = `${cssModulePath}.js`;

// Create the directory structure if it doesn't exist
fs.mkdirSync(path.dirname(cssJsModulePath), { recursive: true });

// Create a JavaScript module that exports an empty object
fs.writeFileSync(cssJsModulePath, 'export default {};\n');

// Create a symlink from the CSS file to the JS file
try {
  if (fs.existsSync(cssModulePath)) {
    fs.unlinkSync(cssModulePath);
  }
  
  // On Windows, we need to use junction instead of symlink for directories
  fs.symlinkSync(cssJsModulePath, cssModulePath, 'file');
  console.log(`Created symlink from ${cssModulePath} to ${cssJsModulePath}`);
} catch (error) {
  console.error(`Error creating symlink: ${error.message}`);
  console.log('Continuing without symlink...');
}

// Run the generate:types command
try {
  console.log('Generating Payload types...');
  execSync('payload generate:types', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: '--no-deprecation'
    }
  });
  console.log('Types generated successfully!');
} catch (error) {
  console.error('Error generating types:', error);
  process.exit(1);
}
