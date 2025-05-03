'use client'

import React from 'react'
import type { CustomComponent } from 'payload'
import type { UIFieldProps } from '@/types/UIFieldProps'

const SimpleInstructions: CustomComponent<UIFieldProps> = () => {
  return (
    <div className="mb-6 p-4 border border-gray-200 rounded-md">
      <h3 className="text-lg font-medium mb-4">Cloud Storage Setup Instructions</h3>

      <div className="mb-4">
        <h4 className="font-medium mb-2">1. Dropbox Setup</h4>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>
            Go to{' '}
            <a
              href="https://www.dropbox.com/developers/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Dropbox Developer Console
            </a>
          </li>
          <li>Create a new app and choose Scoped Access → App Folder.</li>
          <li>Enable the Dropbox Chooser in settings.</li>
          <li>Copy your App Key and paste it into the field below.</li>
        </ul>
      </div>

      <div className="mb-4">
        <h4 className="font-medium mb-2">2. Google Drive Setup</h4>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>
            Go to{' '}
            <a
              href="https://console.cloud.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Google Cloud Console
            </a>
          </li>
          <li>Create a new project and enable the Drive API.</li>
          <li>Configure an OAuth Consent Screen (External user type).</li>
          <li>
            Create OAuth Credentials and copy both the API Key and Client ID into the fields below.
          </li>
        </ul>
      </div>

      <div>
        <h4 className="font-medium mb-2">3. OneDrive Setup</h4>
        <ul className="list-disc list-inside ml-4 space-y-1">
          <li>
            Go to{' '}
            <a
              href="https://portal.azure.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline"
            >
              Microsoft Azure Portal
            </a>
          </li>
          <li>Register a new application under Azure Active Directory.</li>
          <li>Add Microsoft Graph API permission: Files.Read.</li>
          <li>Copy the Application (Client) ID and paste it into the field below.</li>
        </ul>
      </div>
    </div>
  )
}

export default SimpleInstructions
