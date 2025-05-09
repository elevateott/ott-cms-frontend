/**
 * Script to fix revalidation hooks in the codebase
 * This script replaces direct imports of revalidatePath and revalidateTag
 * with a client-safe alternative that uses fetch
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Files to process
const filesToFix = [
  'src/Footer/hooks/revalidateFooter.ts',
  'src/Header/hooks/revalidateHeader.ts',
  'src/collections/Pages/hooks/revalidatePage.ts',
  'src/collections/Posts/hooks/revalidatePost.ts',
  'src/hooks/revalidateRedirects.ts',
]

// Process each file
filesToFix.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath)
  
  try {
    // Read the file
    let content = fs.readFileSync(fullPath, 'utf8')
    
    // Replace imports
    content = content.replace(
      /import\s+\{\s*(revalidatePath|revalidateTag|revalidatePath,\s*revalidateTag|revalidateTag,\s*revalidatePath)\s*\}\s*from\s+['"]next\/cache['"]/g,
      ''
    )
    
    // Replace revalidatePath calls
    content = content.replace(
      /revalidatePath\(\s*([^)]+)\s*\)/g,
      'fetch(`/api/revalidate?path=${encodeURIComponent($1)}`, { method: "POST" }).catch(err => console.error(`Error revalidating path: ${err.message}`))'
    )
    
    // Replace revalidateTag calls
    content = content.replace(
      /revalidateTag\(\s*([^)]+)\s*\)/g,
      'fetch(`/api/revalidate?tag=${encodeURIComponent($1)}`, { method: "POST" }).catch(err => console.error(`Error revalidating tag: ${err.message}`))'
    )
    
    // Write the file back
    fs.writeFileSync(fullPath, content, 'utf8')
    console.log(`Fixed: ${filePath}`)
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error)
  }
})

console.log('Revalidation hooks fixed successfully!')
