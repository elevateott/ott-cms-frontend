'use client'

import React, { useState, useEffect } from 'react'
import { clientLogger } from '@/utils/clientLogger'
import { DropboxButton } from '@/components/buttons/DropboxButton'
import { GoogleDriveButton } from '@/components/buttons/GoogleDriveButton'
import { Loader2 } from 'lucide-react'

interface CloudProviderButtonsProps {
  onFileSelected: (file: File) => void
  disabled?: boolean
}

// Interface for the response from the API
interface CloudIntegrationsResponse {
  dropboxAppKey?: string
  googleClientId?: string
  error?: string
  details?: string
}

const CloudProviderButtons: React.FC<CloudProviderButtonsProps> = ({
  onFileSelected,
  disabled,
}) => {
  const [dropboxAppKey, setDropboxAppKey] = useState<string | null>(null)
  const [googleClientId, setGoogleClientId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [responseData, setResponseData] = useState<CloudIntegrationsResponse | null>(null)

  // Fetch cloud integration settings
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true)
      console.log('Fetching cloud integration settings...')
      console.log('Initial state - isLoading:', true)
      console.log('Initial state - dropboxAppKey:', dropboxAppKey)
      console.log('Initial state - googleClientId:', googleClientId)
      console.log('Initial state - error:', error)
      try {
        clientLogger.info('Fetching cloud integration settings', 'CloudProviderButtons')

        // Use the cloud-integrations API endpoint
        console.log('Fetching from cloud-integrations API endpoint...')
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

        console.log('About to call fetch...')
        const response = await fetch('/api/cloud-integrations', {
          // Add cache control headers to ensure we get fresh data
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
          // signal: controller.signal, // Keep this commented out as requested
        })
        console.log('Fetch completed with status:', response.status)

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error(`Failed to fetch cloud integration settings: ${response.statusText}`)
        }

        console.log('About to parse response JSON...')
        const responseText = await response.text()
        console.log('Response text:', responseText)

        let data: CloudIntegrationsResponse
        try {
          data = JSON.parse(responseText) as CloudIntegrationsResponse
          console.log('Successfully parsed JSON response')
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError)
          throw new Error(`Failed to parse JSON response: ${String(parseError)}`)
        }

        // Store the full response data
        setResponseData(data)

        // Log the raw data for debugging
        console.log('Cloud integration settings raw data:', data)

        clientLogger.info(
          'Cloud integration settings fetched successfully',
          'CloudProviderButtons',
          {
            hasDropboxAppKey: !!data.dropboxAppKey,
            dropboxAppKey: data.dropboxAppKey,
            hasGoogleClientId: !!data.googleClientId,
            googleClientId: data.googleClientId,
            rawData: JSON.stringify(data),
          },
        )

        // Check if there's an error in the response
        if (data.error) {
          setError(data.error)
          setDropboxAppKey(null)
          setGoogleClientId(null)
          clientLogger.warn(
            'Error in cloud integration settings response',
            'CloudProviderButtons',
            {
              error: data.error,
              details: data.details || 'No details provided',
            },
          )
          return
        }

        // Set Dropbox credentials if available
        if (data.dropboxAppKey) {
          setDropboxAppKey(data.dropboxAppKey)
          clientLogger.info('Dropbox key is configured and available', 'CloudProviderButtons')
        } else {
          setDropboxAppKey(null)
          clientLogger.warn(
            'No Dropbox key found in cloud-integrations global',
            'CloudProviderButtons',
          )
        }

        // Set Google Drive credentials if available
        if (data.googleClientId) {
          setGoogleClientId(data.googleClientId)
          clientLogger.info(
            'Google Drive credentials are configured and available',
            'CloudProviderButtons',
          )
        } else {
          setGoogleClientId(null)
          clientLogger.warn(
            'Google Drive credentials not found in cloud-integrations global',
            'CloudProviderButtons',
          )
        }

        // Set error state if no integrations are configured
        if (!data.dropboxAppKey && !data.googleClientId) {
          setError(
            'Cloud integrations are not configured. Please add API keys in the Cloud Integration settings.',
          )
        }
      } catch (error) {
        // Check if this is an abort error (timeout)
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.error(
            'Fetch timeout: Cloud integration settings request timed out after 5 seconds',
          )
          clientLogger.error('Fetch timeout', 'CloudProviderButtons', {
            error: 'Request timed out after 5 seconds',
          })

          // No fallback needed, just log the error
          console.log('Request timed out, no fallback available')

          setError('Request timed out. Please try again or check your network connection.')
        } else {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          console.error('Error fetching cloud integration settings:', errorMsg)
          clientLogger.error('Error fetching cloud integration settings', 'CloudProviderButtons', {
            error: errorMsg,
          })

          // No fallback needed, just log the error
          console.log('Cloud integration settings API failed, no fallback available')

          // If all else fails, set error state
          setError(`Error connecting to cloud integration settings: ${errorMsg}`)
        }

        // Clear the keys in case of error
        setDropboxAppKey(null)
        setGoogleClientId(null)
      } finally {
        console.log('Fetch completed, setting isLoading to false')
        console.log('Final state before setting isLoading to false:')
        console.log('- dropboxAppKey:', dropboxAppKey)
        console.log('- googleClientId:', googleClientId)
        console.log('- error:', error)
        setIsLoading(false)

        // Log the state after a short delay to see if it's updated correctly
        setTimeout(() => {
          console.log('State after timeout:')
          console.log('- isLoading:', isLoading)
          console.log('- dropboxAppKey:', dropboxAppKey)
          console.log('- googleClientId:', googleClientId)
          console.log('- error:', error)
        }, 100)
      }
    }

    fetchSettings()

    // We're intentionally only running this effect once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Show error message if there was an error fetching settings
  const errorMessage = error ? (
    <div
      className={`mb-4 p-4 rounded-md text-sm ${
        error.includes('test values') ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'
      }`}
    >
      <p
        className={`font-medium mb-1 ${
          error.includes('test values') ? 'text-yellow-800' : 'text-red-800'
        }`}
      >
        {error.includes('test values') ? 'Using Test Values' : 'Cloud Integrations Not Configured'}
      </p>
      <p className="mb-2">{error}</p>
      {responseData?.details && <p className="mb-2">{responseData.details}</p>}
      {!responseData?.details && !error.includes('test values') && (
        <p className="mt-1">
          Please go to the Admin Dashboard &gt; Settings &gt; Cloud Integrations and add your API
          keys.
        </p>
      )}
      <div className="flex mt-3">
        <a
          href="/admin/globals/cloud-integrations"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          Go to Cloud Integrations Settings →
        </a>
      </div>
      <div className="mt-3 text-xs text-gray-500">
        <p>
          If the Cloud Integrations settings page doesn't exist yet, you may need to create it
          first.
        </p>
        <p>Go to Admin Dashboard &gt; Settings and look for the Cloud Integrations option.</p>
      </div>
    </div>
  ) : null

  // Log the state right before rendering
  console.log('Rendering CloudProviderButtons with state:')
  console.log('- isLoading:', isLoading)
  console.log('- dropboxAppKey:', dropboxAppKey)
  console.log('- googleClientId:', googleClientId)
  console.log('- error:', error)
  console.log('- responseData:', responseData)
  console.log('- errorMessage:', errorMessage ? 'Error message exists' : 'No error message')

  return (
    <div className="space-y-4">
      {/* Show error message if there was an error */}
      {errorMessage}

      {/* Debug info */}
      <div className="text-xs text-gray-500 mb-2">
        <div>isLoading: {isLoading ? 'true' : 'false'}</div>
        <div>dropboxAppKey: {dropboxAppKey ? 'set' : 'null'}</div>
        <div>googleClientId: {googleClientId ? 'set' : 'null'}</div>
        <div>error: {error ? 'set' : 'null'}</div>
        <div>responseData: {responseData ? 'set' : 'null'}</div>
        {responseData?.details && <div>details: {responseData.details}</div>}
      </div>

      {/* Cloud Provider Buttons */}
      <div className="flex flex-wrap gap-4">
        {isLoading ? (
          <div className="flex items-center space-x-2 h-10 px-4 py-2 border border-input rounded-md">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading cloud providers...</span>
          </div>
        ) : (
          <>
            {/* Dropbox button */}
            {dropboxAppKey && (
              <DropboxButton
                appKey={dropboxAppKey}
                onFileSelected={onFileSelected}
                disabled={disabled}
              />
            )}

            {/* Google Drive button */}
            {googleClientId && (
              <GoogleDriveButton
                clientId={googleClientId}
                onFileSelected={onFileSelected}
                disabled={disabled}
              />
            )}

            {/* Add more cloud provider buttons here in the future */}
          </>
        )}
      </div>
    </div>
  )
}

export default CloudProviderButtons
