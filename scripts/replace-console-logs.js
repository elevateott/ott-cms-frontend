/**
 * Script to replace console.log statements with the new logging system
 *
 * This script will:
 * 1. Find all files with console.log statements
 * 2. Replace them with the appropriate logger calls
 * 3. Generate a report of changes made
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Configuration
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const SRC_DIR = path.resolve(__dirname, '../src')
const REPORT_FILE = path.resolve(__dirname, 'console-log-replacement-report.md')
const DRY_RUN = false // Set to false to actually make changes

// Patterns to identify
const patterns = {
  consoleLog: /console\.log\((.*)\)/g,
  consoleError: /console\.error\((.*)\)/g,
  consoleWarn: /console\.warn\((.*)\)/g,
  consoleInfo: /console\.info\((.*)\)/g,
  consoleDebug: /console\.debug\((.*)\)/g,
}

// Replacement templates
const serverReplacements = {
  consoleLog: (args, context) => `logger.info({ context: '${context}' }, ${args})`,
  consoleError: (args, context) => `logger.error({ context: '${context}' }, ${args})`,
  consoleWarn: (args, context) => `logger.warn({ context: '${context}' }, ${args})`,
  consoleInfo: (args, context) => `logger.info({ context: '${context}' }, ${args})`,
  consoleDebug: (args, context) => `logger.debug({ context: '${context}' }, ${args})`,
}

const clientReplacements = {
  consoleLog: (args, context) => `clientLogger.info(${args}, '${context}')`,
  consoleError: (args, context) => `clientLogger.error(${args}, '${context}')`,
  consoleWarn: (args, context) => `clientLogger.warn(${args}, '${context}')`,
  consoleInfo: (args, context) => `clientLogger.info(${args}, '${context}')`,
  consoleDebug: (args, context) => `clientLogger.debug(${args}, '${context}')`,
}

// Results
const results = {
  totalFiles: 0,
  totalReplacements: 0,
  fileReplacements: [],
}

// Helper function to determine if a file is client-side
function isClientSide(file) {
  return path.extname(file) === '.tsx' || file.includes('/components/') || file.includes('/hooks/')
}

// Helper function to determine the context from the file path
function getContextFromPath(filePath) {
  const relativePath = path.relative(SRC_DIR, filePath)
  const parts = relativePath.split(path.sep)

  // Try to get a meaningful context
  if (parts.length >= 2) {
    if (parts[0] === 'components' && parts.length >= 3) {
      return parts[1] + parts[2].replace(/\.[jt]sx?$/, '')
    }
    if (parts[0] === 'services' && parts.length >= 3) {
      return parts[1] + 'Service'
    }
    if (parts[0] === 'hooks') {
      return parts[1].replace(/\.[jt]sx?$/, '').replace(/^use/, '')
    }
    return parts[parts.length - 2] + '/' + parts[parts.length - 1].replace(/\.[jt]sx?$/, '')
  }

  // Fallback to filename
  return path.basename(filePath, path.extname(filePath))
}

// Helper function to replace console statements in a file
function replaceConsoleStatements(file, content) {
  const isClient = isClientSide(file)
  const context = getContextFromPath(file)
  const replacements = isClient ? clientReplacements : serverReplacements
  let newContent = content
  let replacementCount = 0
  let importsAdded = false

  // Replace each pattern
  Object.entries(patterns).forEach(([patternName, pattern]) => {
    const matches = content.match(pattern)
    if (matches && matches.length > 0) {
      // Add imports if needed
      if (!importsAdded) {
        if (isClient && !content.includes('import { clientLogger }')) {
          newContent = `import { clientLogger } from '@/utils/clientLogger';\n${newContent}`
        } else if (!isClient && !content.includes('import { logger }')) {
          newContent = `import { logger } from '@/utils/logger';\n${newContent}`
        }
        importsAdded = true
      }

      // Replace each occurrence
      matches.forEach((match) => {
        const args = match.substring(match.indexOf('(') + 1, match.lastIndexOf(')'))
        const replacement = replacements[patternName](args, context)
        newContent = newContent.replace(match, replacement)
        replacementCount++
      })
    }
  })

  return { newContent, replacementCount }
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

// Main function to process files
function processFiles() {
  // Get all .ts and .tsx files
  const files = getAllFiles(SRC_DIR, ['.ts', '.tsx'])

  results.totalFiles = files.length

  // Process each file
  files.forEach((file) => {
    const content = fs.readFileSync(file, 'utf8')
    const { newContent, replacementCount } = replaceConsoleStatements(file, content)

    if (replacementCount > 0) {
      results.totalReplacements += replacementCount
      results.fileReplacements.push({
        file: path.relative(SRC_DIR, file),
        count: replacementCount,
      })

      // Write the changes if not a dry run
      if (!DRY_RUN) {
        fs.writeFileSync(file, newContent)
      }
    }
  })

  // Generate report
  generateReport()
}

// Function to generate a report
function generateReport() {
  let report = `# Console Log Replacement Report\n\n`

  // Summary
  report += `## Summary\n\n`
  report += `- Total files analyzed: ${results.totalFiles}\n`
  report += `- Total replacements made: ${results.totalReplacements}\n`
  report += `- Files with replacements: ${results.fileReplacements.length}\n\n`

  if (DRY_RUN) {
    report += `**Note: This was a dry run. No actual changes were made.**\n\n`
  }

  // Files with replacements
  report += `## Files with Replacements\n\n`
  results.fileReplacements
    .sort((a, b) => b.count - a.count)
    .forEach(({ file, count }) => {
      report += `- ${file} (${count} replacements)\n`
    })
  report += `\n`

  // Write report to file
  fs.writeFileSync(REPORT_FILE, report)
  console.log(`Report generated at ${REPORT_FILE}`)
}

// Run the process
processFiles()
