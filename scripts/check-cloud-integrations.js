// scripts/check-cloud-integrations.js
import { getPayload } from 'payload'
import configPromise from '../src/payload.config.ts'

async function checkCloudIntegrations() {
  try {
    console.log('Initializing Payload...')
    const payload = await getPayload({ config: configPromise })

    console.log('Checking for cloud-integrations global...')
    try {
      const cloudIntegrations = await payload.findGlobal({
        slug: 'cloud-integrations',
      })

      console.log('Cloud integrations global found:')
      console.log(JSON.stringify(cloudIntegrations, null, 2))

      // Check if the global has the required fields
      console.log('\nChecking fields:')
      console.log('dropboxAppKey:', cloudIntegrations?.dropboxAppKey ? 'Present' : 'Missing')
      console.log('googleClientId:', cloudIntegrations?.googleClientId ? 'Present' : 'Missing')
    } catch (error) {
      console.error('Error finding cloud-integrations global:', error.message)

      // Try to list all globals
      console.log('\nListing all available globals:')
      try {
        // In Payload v3, we need to use a different approach to list globals
        const globals = await payload.globals.find()
        console.log('Available globals:', Object.keys(globals))
      } catch (listError) {
        console.error('Error listing globals:', listError.message)
      }

      // Try to create the global
      console.log('\nAttempting to create cloud-integrations global...')
      try {
        const result = await payload.updateGlobal({
          slug: 'cloud-integrations',
          data: {
            dropboxAppKey: '',
            googleClientId: '',
          },
        })

        console.log('Cloud integrations global created successfully:')
        console.log(JSON.stringify(result, null, 2))
      } catch (createError) {
        console.error('Error creating cloud-integrations global:', createError.message)
      }
    }
  } catch (error) {
    console.error('Error initializing Payload:', error.message)
  }
}

checkCloudIntegrations()
