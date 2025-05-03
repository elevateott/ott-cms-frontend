// scripts/patch-css-imports.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Find the file that's importing the CSS
const findImportingFile = (directory) => {
  const files = fs.readdirSync(directory, { withFileTypes: true });
  
  for (const file of files) {
    const filePath = path.join(directory, file.name);
    
    if (file.isDirectory()) {
      const result = findImportingFile(filePath);
      if (result) return result;
    } else if (file.name.endsWith('.js') || file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('react-image-crop/dist/ReactCrop.css')) {
          return filePath;
        }
      } catch (error) {
        // Skip files that can't be read
      }
    }
  }
  
  return null;
};

// Find the file in node_modules
console.log('Searching for files importing ReactCrop.css...');
const nodeModulesDir = path.join(rootDir, 'node_modules');
const importingFile = findImportingFile(nodeModulesDir);

if (importingFile) {
  console.log(`Found importing file: ${importingFile}`);
  
  // Read the file content
  const content = fs.readFileSync(importingFile, 'utf8');
  
  // Replace the CSS import with a dummy import
  const patchedContent = content.replace(
    /import ['"]react-image-crop\/dist\/ReactCrop\.css['"]/g,
    '// CSS import removed for Node.js compatibility'
  );
  
  // Write the patched content back
  fs.writeFileSync(importingFile, patchedContent);
  console.log('File patched successfully!');
} else {
  console.log('No files found importing ReactCrop.css');
}

// Create a dummy CSS file
const cssFile = path.join(nodeModulesDir, 'react-image-crop', 'dist', 'ReactCrop.css.js');
fs.mkdirSync(path.dirname(cssFile), { recursive: true });
fs.writeFileSync(cssFile, 'export default {};\n');
console.log(`Created dummy CSS module at ${cssFile}`);

console.log('Patching complete. You can now run generate:types.');
