import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawn } from 'child_process'

// Get the directory name
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

// Load environment variables
dotenv.config({
  path: path.resolve(rootDir, '.env'),
})

console.log('Running Payload command to migrate Slate to Lexical...')

// Use the payload CLI to run the migration
// This is more reliable as it will use the correct config
const payloadCmd = process.platform === 'win32' ? 'payload.cmd' : 'payload'
const child = spawn('npx', [payloadCmd, 'migrate-richtext'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    PAYLOAD_CONFIG_PATH: path.resolve(rootDir, 'src/payload.config.ts'),
  },
})

child.on('close', (code) => {
  if (code === 0) {
    console.log('Migration completed successfully!')
    process.exit(0)
  } else {
    console.error(`Migration failed with code ${code}`)
    process.exit(1)
  }
})
