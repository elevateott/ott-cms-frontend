'use client'

import React from 'react'
import type { CustomComponent } from 'payload'
import type { UIFieldProps } from '@/types/UIFieldProps'

const CloudStorageInstructionsField: CustomComponent<UIFieldProps> = () => {
  return (
    <div className="p-4 border rounded bg-gray-50">
      <h3 className="text-base font-medium mb-2">Cloud Storage Configuration</h3>
      <p className="text-sm mb-3">
        Configure a cloud storage provider for media uploads (excluding videos). When enabled, all
        media uploads will be stored in the selected cloud storage provider instead of local storage.
      </p>

      <h4 className="text-sm font-medium mt-4 mb-1">Provider-Specific Instructions:</h4>
      <div className="space-y-3 text-xs">
        <div>
          <strong>Vercel Blob:</strong> Requires a Vercel Blob token. Create one in your Vercel
          project settings.
        </div>
        <div>
          <strong>Amazon S3:</strong> Requires AWS credentials and a bucket. Make sure the bucket has
          proper CORS configuration.
        </div>
        <div>
          <strong>Azure Blob Storage:</strong> Requires a connection string and container name.
        </div>
        <div>
          <strong>Google Cloud Storage:</strong> Requires a project ID, bucket name, and either a key
          file path or credentials JSON.
        </div>
        <div>
          <strong>UploadThing:</strong> Requires API key, secret key, and app ID from your
          UploadThing dashboard.
        </div>
      </div>

      <div className="mt-4 text-xs text-amber-700 bg-amber-50 p-2 rounded">
        <strong>Note:</strong> Changes to storage provider will only affect new uploads. Existing
        media will remain in their original storage location.
      </div>
    </div>
  )
}

export default CloudStorageInstructionsField
