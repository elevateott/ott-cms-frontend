/**
 * Script to fix 'use client' directive placement
 *
 * This script finds all files with 'use client' directive not at the top
 * and moves it to the top of the file.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Configuration
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SRC_DIR = path.resolve(__dirname, '../src')
const DRY_RUN = false // Set to false to actually make changes

// Results
const results = {
  totalFiles: 0,
  fixedFiles: [],
}

// Helper function to get all files with specific extensions recursively
function getAllFiles(dir, extensions) {
  let files = []

  const items = fs.readdirSync(dir, { withFileTypes: true })

  for (const item of items) {
    const fullPath = path.join(dir, item.name)

    if (item.isDirectory()) {
      files = files.concat(getAllFiles(fullPath, extensions))
    } else if (item.isFile()) {
      const ext = path.extname(item.name).toLowerCase()
      if (extensions.includes(ext)) {
        files.push(fullPath)
      }
    }
  }

  return files
}

// Function to check if 'use client' is not at the top
function checkAndFixUseClient(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')

  // Check if file has 'use client' directive but not at the top
  if (content.includes("'use client'") && !content.trimStart().startsWith("'use client'")) {
    console.log(`Fixing file: ${path.relative(SRC_DIR, filePath)}`)

    // Remove the 'use client' directive from its current position
    let newContent = content.replace(/^.*?'use client'.*?$/m, '')

    // Add 'use client' at the top
    newContent = "'use client'\n\n" + newContent.trimStart()

    // Write the changes if not a dry run
    if (!DRY_RUN) {
      fs.writeFileSync(filePath, newContent)
    }

    return true
  }

  return false
}

// Main function
function main() {
  // Get all .tsx and .ts files
  const files = getAllFiles(SRC_DIR, ['.tsx', '.ts'])
  results.totalFiles = files.length

  // Check and fix each file
  for (const file of files) {
    if (checkAndFixUseClient(file)) {
      results.fixedFiles.push(path.relative(SRC_DIR, file))
    }
  }

  // Print results
  console.log('\nResults:')
  console.log(`Total files checked: ${results.totalFiles}`)
  console.log(`Files fixed: ${results.fixedFiles.length}`)

  if (DRY_RUN) {
    console.log('\nThis was a dry run. No actual changes were made.')
  } else {
    console.log('\nFiles have been updated.')
  }

  if (results.fixedFiles.length > 0) {
    console.log('\nFixed files:')
    results.fixedFiles.forEach((file) => console.log(`- ${file}`))
  }
}

// Run the script
main()
