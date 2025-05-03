/**
 * Script to analyze console.log usage in the project
 *
 * This script will:
 * 1. Find all files with console.log statements
 * 2. Categorize them by file type (server-side, client-side)
 * 3. Identify common patterns
 * 4. Generate a report
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Configuration
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SRC_DIR = path.resolve(__dirname, '../src')
const REPORT_FILE = path.resolve(__dirname, 'console-log-report.md')

// Patterns to identify
const patterns = {
  // Match both single-line and multi-line console.log statements
  consoleLog: /console\.log\([^)]*\)|console\.log\([\s\S]*?\);/g,
  consoleError: /console\.error\([^)]*\)|console\.error\([\s\S]*?\);/g,
  consoleWarn: /console\.warn\([^)]*\)|console\.warn\([\s\S]*?\);/g,
  consoleInfo: /console\.info\([^)]*\)|console\.info\([\s\S]*?\);/g,
  consoleDebug: /console\.debug\([^)]*\)|console\.debug\([\s\S]*?\);/g,
}

// File categories
const categories = {
  serverSide: ['.ts'],
  clientSide: ['.tsx'],
  both: ['.ts', '.tsx'],
}

// Results
const results = {
  totalFiles: 0,
  totalOccurrences: {
    consoleLog: 0,
    consoleError: 0,
    consoleWarn: 0,
    consoleInfo: 0,
    consoleDebug: 0,
  },
  filesByCategory: {
    serverSide: [],
    clientSide: [],
    both: [],
  },
  filesByPattern: {
    consoleLog: [],
    consoleError: [],
    consoleWarn: [],
    consoleInfo: [],
    consoleDebug: [],
  },
}

// Helper function to check if a file is in a category
function isInCategory(file, category) {
  const ext = path.extname(file)
  return categories[category].includes(ext)
}

// Helper function to count pattern occurrences in a file
function countPatternOccurrences(content, pattern) {
  const matches = content.match(pattern)
  return matches ? matches.length : 0
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

// Main function to analyze files
function analyzeFiles() {
  // Get all .ts and .tsx files
  const files = getAllFiles(SRC_DIR, ['.ts', '.tsx'])

  results.totalFiles = files.length

  // Analyze each file
  files.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8')
    let hasConsoleStatements = false

    // Check for each pattern
    Object.entries(patterns).forEach(([patternName, pattern]) => {
      const count = countPatternOccurrences(content, pattern)
      if (count > 0) {
        hasConsoleStatements = true
        results.totalOccurrences[patternName] += count
        results.filesByPattern[patternName].push({
          file: path.relative(SRC_DIR, file),
          count,
        })
      }
    })

    // Categorize the file if it has console statements
    if (hasConsoleStatements) {
      if (isInCategory(file, 'serverSide') && !isInCategory(file, 'clientSide')) {
        results.filesByCategory.serverSide.push(path.relative(SRC_DIR, file))
      } else if (!isInCategory(file, 'serverSide') && isInCategory(file, 'clientSide')) {
        results.filesByCategory.clientSide.push(path.relative(SRC_DIR, file))
      } else {
        results.filesByCategory.both.push(path.relative(SRC_DIR, file))
      }
    }
  })

  // Generate report
  generateReport()
}

// Function to generate a report
function generateReport() {
  let report = `# Console Log Usage Report\n\n`

  // Summary
  report += `## Summary\n\n`
  report += `- Total files analyzed: ${results.totalFiles}\n`
  report += `- Files with console.log: ${results.filesByPattern.consoleLog.length}\n`
  report += `- Files with console.error: ${results.filesByPattern.consoleError.length}\n`
  report += `- Files with console.warn: ${results.filesByPattern.consoleWarn.length}\n`
  report += `- Files with console.info: ${results.filesByPattern.consoleInfo.length}\n`
  report += `- Files with console.debug: ${results.filesByPattern.consoleDebug.length}\n\n`

  report += `- Total console.log occurrences: ${results.totalOccurrences.consoleLog}\n`
  report += `- Total console.error occurrences: ${results.totalOccurrences.consoleError}\n`
  report += `- Total console.warn occurrences: ${results.totalOccurrences.consoleWarn}\n`
  report += `- Total console.info occurrences: ${results.totalOccurrences.consoleInfo}\n`
  report += `- Total console.debug occurrences: ${results.totalOccurrences.consoleDebug}\n\n`

  // Files by category
  report += `## Files by Category\n\n`
  report += `### Server-Side Files (${results.filesByCategory.serverSide.length})\n\n`
  results.filesByCategory.serverSide.forEach((file) => {
    report += `- ${file}\n`
  })
  report += `\n`

  report += `### Client-Side Files (${results.filesByCategory.clientSide.length})\n\n`
  results.filesByCategory.clientSide.forEach((file) => {
    report += `- ${file}\n`
  })
  report += `\n`

  report += `### Both Server and Client Files (${results.filesByCategory.both.length})\n\n`
  results.filesByCategory.both.forEach((file) => {
    report += `- ${file}\n`
  })
  report += `\n`

  // Files by pattern
  report += `## Files by Pattern\n\n`
  report += `### Files with console.log (${results.filesByPattern.consoleLog.length})\n\n`
  results.filesByPattern.consoleLog
    .sort((a, b) => b.count - a.count)
    .forEach(({ file, count }) => {
      report += `- ${file} (${count} occurrences)\n`
    })
  report += `\n`

  report += `### Files with console.error (${results.filesByPattern.consoleError.length})\n\n`
  results.filesByPattern.consoleError
    .sort((a, b) => b.count - a.count)
    .forEach(({ file, count }) => {
      report += `- ${file} (${count} occurrences)\n`
    })
  report += `\n`

  report += `### Files with console.warn (${results.filesByPattern.consoleWarn.length})\n\n`
  results.filesByPattern.consoleWarn
    .sort((a, b) => b.count - a.count)
    .forEach(({ file, count }) => {
      report += `- ${file} (${count} occurrences)\n`
    })
  report += `\n`

  // Write report to file
  fs.writeFileSync(REPORT_FILE, report)
  console.log(`Report generated at ${REPORT_FILE}`)
}

// Run the analysis
analyzeFiles()
