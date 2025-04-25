# Cloud Provider Integration for Video Uploads

This document provides instructions for setting up cloud provider integrations (Dropbox, Google Drive, and OneDrive) for video uploads in the OTT CMS Frontend.

## Overview

The OTT CMS Frontend supports uploading videos from the following cloud providers:

- Dropbox
- Google Drive
- OneDrive

These integrations allow users to select videos directly from their cloud storage accounts and upload them to the platform.

## Prerequisites

Before setting up the cloud provider integrations, you need to create developer accounts and applications with each provider:

1. **Dropbox**: Create an app in the [Dropbox Developer Console](https://www.dropbox.com/developers/apps)
2. **Google Drive**: Create a project in the [Google Cloud Console](https://console.cloud.google.com/)
3. **OneDrive**: Register an application in the [Microsoft Azure Portal](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)

## Configuration

### Environment Variables

Add the following environment variables to your `.env.local` file:

```
# Cloud Provider API Keys
NEXT_PUBLIC_DROPBOX_APP_KEY=your_dropbox_app_key
NEXT_PUBLIC_GOOGLE_API_KEY=your_google_api_key
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
NEXT_PUBLIC_ONEDRIVE_CLIENT_ID=your_onedrive_client_id
```

### Dropbox Setup

1. Go to the [Dropbox Developer Console](https://www.dropbox.com/developers/apps)
2. Click "Create app"
3. Choose "Dropbox API"
4. Choose "Full Dropbox" or "App folder" access depending on your needs
5. Name your app
6. Under "Permissions", add the following permissions:
   - `files.metadata.read`
   - `files.content.read`
7. Under "OAuth 2", add your app's redirect URL (e.g., `https://your-domain.com`)
8. Copy the "App key" and add it to your `.env.local` file as `NEXT_PUBLIC_DROPBOX_APP_KEY`

### Google Drive Setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable the Google Drive API and Google Picker API
4. Create OAuth 2.0 credentials:
   - Go to "Credentials" > "Create credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add your authorized JavaScript origins (e.g., `https://your-domain.com`)
   - Add your authorized redirect URIs (e.g., `https://your-domain.com/oauth2callback`)
5. Create an API key:
   - Go to "Credentials" > "Create credentials" > "API key"
   - Restrict the API key to the Google Drive API and Google Picker API
6. Copy the OAuth client ID and API key to your `.env.local` file as `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and `NEXT_PUBLIC_GOOGLE_API_KEY`

### OneDrive Setup

1. Go to the [Microsoft Azure Portal](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Click "New registration"
3. Name your application
4. Set the redirect URI to your domain (e.g., `https://your-domain.com`)
5. Under "API permissions", add the following permissions:
   - Microsoft Graph > Files.Read
   - Microsoft Graph > Files.Read.All
6. Copy the "Application (client) ID" and add it to your `.env.local` file as `NEXT_PUBLIC_ONEDRIVE_CLIENT_ID`

## Implementation Details

The cloud provider integration is implemented in the following files:

- `src/components/video/CloudProviderButtons.tsx`: Component for cloud provider buttons
- `src/components/video/MuxVideoUploader.tsx`: Integration with the Mux uploader

### How It Works

1. The user clicks on a cloud provider button
2. The cloud provider's file picker opens
3. The user selects a video file
4. The file is downloaded from the cloud provider
5. The file is converted to a File object
6. The File object is passed to the Mux uploader
7. The video is uploaded to Mux

## Troubleshooting

### Dropbox Integration

- If the Dropbox button is disabled, check that the Dropbox SDK is loaded correctly
- Ensure your Dropbox app key is correct
- Check that your domain is added to the allowed domains in your Dropbox app settings

### Google Drive Integration

- If the Google Drive button is disabled, check that the Google API SDK is loaded correctly
- Ensure your Google API key and client ID are correct
- Check that your domain is added to the allowed origins in your Google Cloud Console

### OneDrive Integration

- If the OneDrive button is disabled, check that the OneDrive SDK is loaded correctly
- Ensure your OneDrive client ID is correct
- Check that your domain is added to the allowed redirect URIs in your Azure Portal

## Testing

To test the cloud provider integrations locally:

1. Add your local development URL (e.g., `http://localhost:3000`) to the allowed domains/origins in each cloud provider's developer console
2. Set up your environment variables in `.env.local`
3. Run the application locally
4. Upload a video from each cloud provider

## References

- [Dropbox Chooser SDK Documentation](https://www.dropbox.com/developers/chooser)
- [Google Picker API Documentation](https://developers.google.com/drive/api/v3/picker)
- [OneDrive File Picker SDK Documentation](https://learn.microsoft.com/en-us/onedrive/developer/controls/file-pickers/js-v72/)
