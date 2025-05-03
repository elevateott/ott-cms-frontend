# Cloud Integrations Settings

This document provides instructions for configuring cloud storage integrations (Dropbox, Google Drive, and OneDrive) for video uploads in the OTT CMS.

## Overview

The OTT CMS supports uploading videos from the following cloud providers:

- Dropbox
- Google Drive
- OneDrive

These integrations allow users to select videos directly from their cloud storage accounts and upload them to the platform.

## Configuration

Cloud integrations are configured through the CMS admin panel in the "Cloud Integrations" global settings.

### Accessing Cloud Integrations Settings

1. Log in to the CMS admin panel
2. Navigate to "System Settings" in the sidebar
3. Select "Cloud Integrations"

### Available Settings

The following settings are available:

| Setting | Description |
|---------|-------------|
| Dropbox App Key | API key for Dropbox integration |
| Google API Key | API key for Google Drive integration |
| Google Client ID | OAuth client ID for Google Drive integration |
| OneDrive Client ID | Application (client) ID for OneDrive integration |

### Setting Up Cloud Provider Accounts

#### Dropbox

1. Go to the [Dropbox Developer Console](https://www.dropbox.com/developers/apps)
2. Click "Create app"
3. Choose "Dropbox API"
4. Choose "Full Dropbox" or "App folder" access depending on your needs
5. Name your app
6. Under "Permissions", add the following permissions:
   - `files.metadata.read`
   - `files.content.read`
7. Under "OAuth 2", add your app's redirect URL (e.g., `https://your-domain.com`)
8. Copy the "App key" and add it to the "Dropbox App Key" field in the Cloud Integrations settings

#### Google Drive

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
6. Copy the OAuth client ID and API key to the "Google Client ID" and "Google API Key" fields in the Cloud Integrations settings

#### OneDrive

1. Go to the [Microsoft Azure Portal](https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)
2. Click "New registration"
3. Name your application
4. Set the redirect URI to your domain (e.g., `https://your-domain.com`)
5. Under "API permissions", add the following permissions:
   - Microsoft Graph > Files.Read
   - Microsoft Graph > Files.Read.All
6. Copy the "Application (client) ID" and add it to the "OneDrive Client ID" field in the Cloud Integrations settings

## Troubleshooting

### Common Issues

#### Cloud Provider Buttons Are Not Showing

- Check that "Enable Cloud Integrations" is turned on in the Cloud Integrations settings
- Verify that you have entered the correct API keys for each provider
- Check the browser console for any JavaScript errors

#### "Integration Not Configured" Error

- Verify that you have entered the correct API keys for the provider in the Cloud Integrations settings
- Make sure the API keys have the correct permissions

#### File Selection Works But Download Fails

- Check that your cloud provider app has the correct permissions
- Verify that the file is accessible to the app
- Check the browser console for any network errors

## Security Considerations

- API keys and client IDs are stored in the database and should be treated as sensitive information
- Consider restricting API keys to specific domains to prevent unauthorized use
- Regularly review and rotate API keys according to your security policies
