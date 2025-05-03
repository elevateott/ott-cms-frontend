'use client'

import React, { useState } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Copy, Check, Facebook, Twitter, Linkedin, Share2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { clientLogger } from '@/utils/clientLogger'
import { generateSocialLinks } from '@/utilities/generateSocialLinks'

const logger = clientLogger.createContextLogger('SocialSharingPanel')

export const SocialSharingPanel: React.FC = () => {
  const { document, id } = useDocumentInfo()
  const { toast } = useToast()

  const [copied, setCopied] = useState<Record<string, boolean>>({
    url: false,
    facebook: false,
    twitter: false,
    linkedin: false,
    whatsapp: false,
    embedCode: false,
    embedCardCode: false,
  })

  // Get the collection type from the document
  const collection = document?.collection?.slug as 'content' | 'series'

  // Generate social links if document has title and slug
  const socialLinks =
    document?.title && document?.slug
      ? generateSocialLinks({
          title: document.title as string,
          slug: document.slug as string,
          collection,
          imageUrl: document.posterImage?.url || document.thumbnail?.url,
          description: (document.description as string) || '',
        })
      : null

  // Handle copy to clipboard
  const handleCopy = async (value: string, type: keyof typeof copied) => {
    try {
      await navigator.clipboard.writeText(value)

      // Update copied state
      setCopied((prev) => ({
        ...prev,
        [type]: true,
      }))

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopied((prev) => ({
          ...prev,
          [type]: false,
        }))
      }, 2000)

      // Show toast
      toast({
        title: 'Copied to clipboard',
        description: 'The value has been copied to your clipboard.',
        duration: 2000,
      })

      logger.info(`Copied ${type} to clipboard`)
    } catch (error) {
      logger.error('Failed to copy to clipboard', error)
      toast({
        title: 'Copy failed',
        description: 'Failed to copy to clipboard. Please try again.',
        variant: 'destructive',
        duration: 3000,
      })
    }
  }

  // If no document or missing required fields, show a message
  if (!document?.title || !document?.slug || !socialLinks) {
    return (
      <div className="p-4 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-500">
          Save this document with a title and slug to generate sharing links.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-white rounded-md border border-gray-200">
      <h3 className="text-base font-medium mb-4">Social Sharing</h3>

      <Tabs defaultValue="links" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="links">Share Links</TabsTrigger>
          <TabsTrigger value="embed">Embed Codes</TabsTrigger>
        </TabsList>

        {/* Share Links Tab */}
        <TabsContent value="links" className="space-y-4">
          {/* Direct URL */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Direct Link</div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 text-sm bg-gray-50 p-2 rounded border border-gray-200 overflow-x-auto">
                {socialLinks.url}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(socialLinks.url, 'url')}
                title="Copy URL"
              >
                {copied.url ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Social Media</div>
            <div className="flex flex-wrap gap-2">
              {/* Facebook */}
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => handleCopy(socialLinks.facebook, 'facebook')}
              >
                <Facebook className="h-4 w-4 text-blue-600" />
                {copied.facebook ? 'Copied!' : 'Facebook'}
              </Button>

              {/* Twitter */}
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => handleCopy(socialLinks.twitter, 'twitter')}
              >
                <Twitter className="h-4 w-4 text-sky-500" />
                {copied.twitter ? 'Copied!' : 'Twitter'}
              </Button>

              {/* LinkedIn */}
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => handleCopy(socialLinks.linkedin, 'linkedin')}
              >
                <Linkedin className="h-4 w-4 text-blue-700" />
                {copied.linkedin ? 'Copied!' : 'LinkedIn'}
              </Button>

              {/* WhatsApp */}
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => handleCopy(socialLinks.whatsapp, 'whatsapp')}
              >
                <Share2 className="h-4 w-4 text-green-500" />
                {copied.whatsapp ? 'Copied!' : 'WhatsApp'}
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Embed Codes Tab */}
        <TabsContent value="embed" className="space-y-4">
          {/* iFrame Embed */}
          <div className="space-y-2">
            <div className="text-sm font-medium">iFrame Embed</div>
            <div className="text-xs text-gray-500 mb-2">
              Use this iframe to embed the player in your website.
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 font-mono text-xs bg-gray-50 p-2 rounded border border-gray-200 overflow-x-auto whitespace-pre">
                {socialLinks.embedCode}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(socialLinks.embedCode, 'embedCode')}
                title="Copy iFrame Embed"
              >
                {copied.embedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Card Embed */}
          <div className="space-y-2">
            <div className="text-sm font-medium">Card Embed</div>
            <div className="text-xs text-gray-500 mb-2">
              Use this HTML to embed a card with thumbnail and title.
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex-1 font-mono text-xs bg-gray-50 p-2 rounded border border-gray-200 overflow-x-auto whitespace-pre">
                {socialLinks.embedCardCode}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(socialLinks.embedCardCode, 'embedCardCode')}
                title="Copy Card Embed"
              >
                {copied.embedCardCode ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
        <p>
          <strong>Tip:</strong> Share links will open in a new window. Embed codes can be pasted
          into your website's HTML.
        </p>
      </div>
    </div>
  )
}

export default SocialSharingPanel
