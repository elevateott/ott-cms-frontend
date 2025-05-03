// scripts/migrate-slate-to-lexical.js
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import payload from 'payload'

// Get the directory name
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

// Load environment variables
dotenv.config({
  path: path.resolve(rootDir, '.env'),
})

// Run the migration
async function migrate() {
  try {
    console.log('Initializing Payload...')
    
    // Initialize Payload with the config path
    await payload.init({
      secret: process.env.PAYLOAD_SECRET || 'YOUR-SECRET-HERE',
      local: true,
      configPath: path.resolve(rootDir, 'src/payload.config.ts'),
    })
    
    console.log('Running Slate to Lexical migration...')
    
    // Dynamically import the migration function
    const { migrateSlateToLexical } = await import('@payloadcms/richtext-lexical/migrate')
    
    // Run the migration
    await migrateSlateToLexical({ 
      payload,
      collections: [
        'content',
        'series',
        'subscription-plans',
        'creators',
        'subscribers',
        'users',
      ],
      globals: [
        'payment-settings',
        'streaming-sources',
      ],
    })
    
    console.log('Migration completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Error during migration:', error)
    process.exit(1)
  }
}

migrate()
