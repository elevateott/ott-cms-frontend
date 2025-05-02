'use client'

import React, { useState, useEffect } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Copy, Check, ExternalLink } from 'lucide-react'
import { clientLogger } from '@/utils/clientLogger'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { getPlaybackUrl } from '@/utils/getPlaybackUrl'

const logger = clientLogger.createContextLogger('PlaybackIntegrationPanel')

export const PlaybackIntegrationPanel: React.FC = () => {
  const { document, id } = useDocumentInfo()
  const { toast } = useToast()
  
  const [copied, setCopied] = useState<Record<string, boolean>>({
    hlsUrl: false,
    iframeSnippet: false,
    videoTag: false,
  })
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [isGeneratingSignedUrl, setIsGeneratingSignedUrl] = useState(false)
  const [activeTab, setActiveTab] = useState('iframe')

  // Extract data from document
  const useExternalHlsUrl = document?.useExternalHlsUrl
  const externalHlsUrl = document?.externalHlsUrl
  const muxPlaybackIds = document?.muxPlaybackIds || []
  const playbackPolicy = document?.playbackPolicy || 'public'
  
  // Compute effective HLS URL
  const effectiveHlsUrl = getPlaybackUrl(document)
  const controlSource = useExternalHlsUrl ? 'External-Controlled' : 'Mux-Controlled'
  const requiresSignedToken = !useExternalHlsUrl && playbackPolicy === 'signed'

  // Generate iframe snippet
  const getIframeSnippet = () => {
    if (!effectiveHlsUrl) return ''
    
    // For a real implementation, you would use your frontend URL here
    const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://your-frontend.com'
    return `<iframe src="${frontendUrl}/player?streamId=${id}" width="640" height="360" frameborder="0" allowfullscreen></iframe>`
  }

  // Generate video tag snippet
  const getVideoTagSnippet = () => {
    if (!effectiveHlsUrl) return ''
    
    return `<video controls autoplay>
  <source src="${effectiveHlsUrl}" type="application/vnd.apple.mpegurl">
  Your browser does not support the video tag.
</video>`
  }

  // Generate signed URL for playback
  const generateSignedUrl = async () => {
    try {
      setIsGeneratingSignedUrl(true)
      
      const response = await fetch(`/api/admin/live-events/${id}/signed-playback?ttl=3600`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to generate signed URL')
      }
      
      const data = await response.json()
      setSignedUrl(data.signedUrl)
      
      toast({
        title: 'Success',
        description: 'Signed URL generated successfully (valid for 1 hour)',
        duration: 3000,
      })
      
      logger.info('Generated signed playback URL')
    } catch (error) {
      logger.error('Error generating signed URL:', error)
      
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate signed URL',
        variant: 'destructive',
        duration: 3000,
      })
    } finally {
      setIsGeneratingSignedUrl(false)
    }
  }

  // Handle copy to clipboard
  const handleCopy = async (value: string, type: 'hlsUrl' | 'iframeSnippet' | 'videoTag') => {
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

  // If no playback URL is available, show a message
  if (!effectiveHlsUrl) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Playback Integration</CardTitle>
          <CardDescription>
            No playback URL available yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              {useExternalHlsUrl
                ? 'Please enter a valid external HLS URL to enable playback.'
                : 'Playback URLs will be available once the live stream is created.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Playback Integration</CardTitle>
          <Badge variant={controlSource === 'Mux-Controlled' ? 'default' : 'secondary'}>
            {controlSource}
          </Badge>
        </div>
        <CardDescription>
          Integration options for your live stream
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Effective HLS URL */}
        <div className="space-y-2">
          <div className="font-medium">Effective HLS URL</div>
          <div className="flex items-center space-x-2">
            <div className="flex-1 font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200 overflow-x-auto">
              {effectiveHlsUrl}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCopy(effectiveHlsUrl, 'hlsUrl')}
              title="Copy HLS URL"
            >
              {copied.hlsUrl ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <div className="text-sm text-gray-500">
            Use this URL in your web, mobile, Roku, Fire TV, or other players that support HLS.
          </div>
        </div>
        
        {/* Signed Playback Warning */}
        {requiresSignedToken && (
          <Alert variant="warning">
            <AlertDescription>
              <strong>Note:</strong> This stream requires a signed token for playback. For direct embedding, 
              you'll need to generate a signed URL or implement token signing in your application.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Generate Signed URL (if needed) */}
        {requiresSignedToken && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="font-medium">Generate Temporary Signed URL</div>
              <Button
                variant="outline"
                size="sm"
                onClick={generateSignedUrl}
                disabled={isGeneratingSignedUrl}
              >
                {isGeneratingSignedUrl ? 'Generating...' : 'Generate (1 hour)'}
              </Button>
            </div>
            
            {signedUrl && (
              <div className="flex items-center space-x-2">
                <div className="flex-1 font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200 overflow-x-auto">
                  {signedUrl}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleCopy(signedUrl, 'hlsUrl')}
                  title="Copy Signed URL"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
        
        <Separator />
        
        {/* Embedding Options */}
        <div className="space-y-4">
          <div className="font-medium">Embedding Options</div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="iframe">iFrame Embed</TabsTrigger>
              <TabsTrigger value="video">Video Tag</TabsTrigger>
            </TabsList>
            
            {/* iFrame Embed */}
            <TabsContent value="iframe" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="text-sm text-gray-500">
                  Use this iframe to embed the player in your website. This is the recommended method for most websites.
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200 overflow-x-auto whitespace-pre">
                    {getIframeSnippet()}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(getIframeSnippet(), 'iframeSnippet')}
                    title="Copy iFrame Snippet"
                  >
                    {copied.iframeSnippet ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            {/* Video Tag */}
            <TabsContent value="video" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="text-sm text-gray-500">
                  Use this HTML5 video tag to embed the player directly in your website. This method requires HLS.js for browsers that don't support HLS natively.
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 font-mono text-sm bg-gray-50 p-2 rounded border border-gray-200 overflow-x-auto whitespace-pre">
                    {getVideoTagSnippet()}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleCopy(getVideoTagSnippet(), 'videoTag')}
                    title="Copy Video Tag"
                  >
                    {copied.videoTag ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              {!useExternalHlsUrl && (
                <div className="text-sm">
                  <a 
                    href="https://docs.mux.com/guides/video/play-your-videos" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
                  >
                    <span>Learn more about Mux video playback</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  )
}

export default PlaybackIntegrationPanel
