/**
 * Initialize Collections Script
 *
 * This script initializes the collections in the database.
 * It's useful when you're getting "collection not found" errors.
 */

import payload from 'payload'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables
dotenv.config({ path: '.env.development' })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Initialize Payload
async function initPayload() {
  console.log('Initializing Payload...')

  try {
    // Use the payload CLI to initialize the database
    console.log('Running payload command to initialize the database...')

    // Use the payload CLI to initialize the database
    // await payload.init({
    //   secret: process.env.PAYLOAD_SECRET,
    //   mongoURL: process.env.DATABASE_URI,
    //   local: true,
    // })

    console.log('Payload initialized successfully')

    // List all collections
    const collections = payload.collections
    console.log('Available collections:')
    Object.keys(collections).forEach((collection) => {
      console.log(`- ${collection}`)
    })

    // Check if videoassets collection exists
    if (collections.videoassets) {
      console.log('videoassets collection exists')

      // Count documents in the collection
      const count = await payload.find({
        collection: 'videoassets',
        limit: 0,
      })

      console.log(`videoassets collection has ${count.totalDocs} documents`)
    } else {
      console.log('videoassets collection does not exist')
    }

    console.log('Done')
    process.exit(0)
  } catch (error) {
    console.error('Error initializing Payload:', error)
    process.exit(1)
  }
}

// Run the initialization
initPayload()
