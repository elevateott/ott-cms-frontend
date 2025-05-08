// Simple script to check for references to usingFallback
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'video', 'CloudProviderButtons.tsx');
const content = fs.readFileSync(filePath, 'utf8');

// Check for any references to usingFallback
const matches = content.match(/usingFallback/g);
if (matches) {
  console.log(`Found ${matches.length} references to usingFallback:`);
  
  // Find the line numbers
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('usingFallback')) {
      console.log(`Line ${index + 1}: ${line.trim()}`);
    }
  });
} else {
  console.log('No references to usingFallback found in the file.');
}
