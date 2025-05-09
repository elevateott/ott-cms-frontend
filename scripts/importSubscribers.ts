// scripts/importSubscribers.ts
import fs from 'fs'
import path from 'path'
import { parse } from 'csv-parser'
import { Readable } from 'stream'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { logger } from '@/utils/logger'

interface SubscriberCSVRow {
  email: string
  fullName: string
  subscriptionStatus?: string
  hasManualSubscription?: string
  notes?: string
  activePlans?: string // Comma-separated plan IDs
  purchasedPPV?: string // Comma-separated event IDs
}

async function importSubscribers(csvFilePath: string) {
  try {
    // Validate file path
    if (!fs.existsSync(csvFilePath)) {
      console.error(`❌ File not found: ${csvFilePath}`)
      return
    }

    // Initialize Payload
    console.log('🚀 Initializing Payload...')
    const payload = await getPayload({ config: configPromise })

    // Parse CSV file
    console.log(`📊 Parsing CSV file: ${csvFilePath}`)
    const rows: SubscriberCSVRow[] = []

    // Read the file and parse CSV
    const fileContent = fs.readFileSync(csvFilePath, 'utf8')
    const readable = Readable.from([fileContent])

    await new Promise<void>((resolve, reject) => {
      readable
        .pipe(parse())
        .on('data', (row: SubscriberCSVRow) => rows.push(row))
        .on('end', () => resolve())
        .on('error', (error) => reject(error))
    })

    console.log(`📋 Found ${rows.length} subscribers to import`)

    // Process each row
    let successCount = 0
    let errorCount = 0

    for (const [index, row] of rows.entries()) {
      try {
        // Validate required fields
        if (!row.email || !row.fullName) {
          console.error(`❌ Row ${index + 1}: Missing required fields (email or fullName)`)
          errorCount++
          continue
        }

        // Check if subscriber already exists
        const existingSubscribers = await payload.find({
          collection: 'subscribers',
          where: {
            email: {
              equals: row.email,
            },
          },
        })

        if (existingSubscribers.docs.length > 0) {
          console.warn(
            `⚠️ Row ${index + 1}: Subscriber with email ${row.email} already exists, skipping`,
          )
          errorCount++
          continue
        }

        // Prepare subscriber data
        const subscriberData: Record<string, any> = {
          email: row.email,
          fullName: row.fullName,
          subscriptionStatus: row.subscriptionStatus || 'none',
          hasManualSubscription: row.hasManualSubscription === 'true',
          notes: row.notes || '',
        }

        // Handle active plans if provided
        if (row.activePlans) {
          const planIds = row.activePlans
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean)
          if (planIds.length > 0) {
            subscriberData.activePlans = planIds
          }
        }

        // Handle purchased PPV events if provided
        if (row.purchasedPPV) {
          const eventIds = row.purchasedPPV
            .split(',')
            .map((id) => id.trim())
            .filter(Boolean)
          if (eventIds.length > 0) {
            subscriberData.purchasedPPV = eventIds
          }
        }

        // Create the subscriber
        await payload.create({
          collection: 'subscribers',
          data: subscriberData,
        })

        console.log(`✅ Row ${index + 1}: Created subscriber ${row.email}`)
        successCount++
      } catch (error) {
        console.error(`❌ Row ${index + 1}: Error creating subscriber ${row.email}:`, error)
        errorCount++
      }
    }

    console.log('\n📊 Import Summary:')
    console.log(`✅ Successfully imported: ${successCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log(`📋 Total rows processed: ${rows.length}`)
  } catch (error) {
    console.error('❌ Import failed:', error)
  }
}

// Check if this script is being run directly
if (require.main === module) {
  // Get the CSV file path from command line arguments
  const csvFilePath = process.argv[2]

  if (!csvFilePath) {
    console.error('❌ Please provide a CSV file path as an argument')
    console.log('Usage: ts-node scripts/importSubscribers.ts ./data/subscribers.csv')
    process.exit(1)
  }

  // Run the import
  importSubscribers(csvFilePath)
    .then(() => {
      console.log('🎉 Import process completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Import process failed:', error)
      process.exit(1)
    })
}

export { importSubscribers }
