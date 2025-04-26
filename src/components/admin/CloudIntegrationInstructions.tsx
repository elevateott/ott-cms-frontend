'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
import type { CustomComponent } from 'payload'
import type { UIFieldProps } from '@/types/UIFieldProps'

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Button onClick={handleCopy} size="icon" variant="ghost" className="ml-2">
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
      <span className="sr-only">Copy URL</span>
    </Button>
  )
}

const CloudIntegrationInstructions: CustomComponent<UIFieldProps> = (_props: UIFieldProps) => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Cloud Storage Setup Instructions</CardTitle>
      </CardHeader>
      <CardContent className="text-sm space-y-4">
        <Accordion type="multiple" className="w-full">
          <AccordionItem value="dropbox">
            <AccordionTrigger>1. Dropbox Setup</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li className="flex items-center">
                  <span>
                    Go to{' '}
                    <a
                      href="https://www.dropbox.com/developers/apps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      Dropbox Developer Console
                    </a>
                  </span>
                  <CopyButton text="https://www.dropbox.com/developers/apps" />
                </li>
                <li>Create a new app and choose Scoped Access → App Folder.</li>
                <li>Enable the Dropbox Chooser in settings.</li>
                <li>Copy your App Key and paste it into the field below.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="google">
            <AccordionTrigger>2. Google Drive Setup</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li className="flex items-center">
                  <span>
                    Go to{' '}
                    <a
                      href="https://console.cloud.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      Google Cloud Console
                    </a>
                  </span>
                  <CopyButton text="https://console.cloud.google.com/" />
                </li>
                <li>Create a new project and enable the Drive API.</li>
                <li>Configure an OAuth Consent Screen (External user type).</li>
                <li>
                  Create OAuth Credentials and copy both the API Key and Client ID into the fields
                  below.
                </li>
              </ul>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="onedrive">
            <AccordionTrigger>3. OneDrive Setup</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li className="flex items-center">
                  <span>
                    Go to{' '}
                    <a
                      href="https://portal.azure.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      Microsoft Azure Portal
                    </a>
                  </span>
                  <CopyButton text="https://portal.azure.com/" />
                </li>
                <li>Register a new application under Azure Active Directory.</li>
                <li>Add Microsoft Graph API permission: Files.Read.</li>
                <li>Copy the Application (Client) ID and paste it into the field below.</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}

export default CloudIntegrationInstructions
