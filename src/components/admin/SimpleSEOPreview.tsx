'use client'

import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// This is a simplified version that doesn't rely on Payload's hooks
const SimpleSEOPreview: React.FC = () => {
  // Use static data for the preview
  const [activeTab, setActiveTab] = useState<string>('google')
  
  // Static placeholder data
  const title = 'Your Page Title'
  const description = 'This is a short description of your content, optimized for search engines.'
  const canonicalURL = 'https://yourdomain.com/page-title'
  const domain = 'yourdomain.com'
  const twitterCard = 'summary_large_image'
  const twitterHandle = '@yourbrand'
  
  return (
    <div className="border rounded p-4 bg-card mt-4 text-sm max-w-xl shadow">
      <Tabs defaultValue="google" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-2 mb-4">
          <TabsTrigger value="google">Google Preview</TabsTrigger>
          <TabsTrigger value="social">Social Card Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="google" className="space-y-2">
          <div className="text-blue-600 text-sm mb-1 truncate">{canonicalURL}</div>
          <div className="font-bold text-lg text-gray-800 mb-1 line-clamp-1">{title}</div>
          <div className="text-gray-600 line-clamp-2">{description}</div>
          <div className="mt-2 text-xs text-gray-400">
            <span>Google search results preview - updates as you type</span>
          </div>
        </TabsContent>
        
        <TabsContent value="social" className="space-y-2">
          <div className="border rounded overflow-hidden bg-white">
            <div className="bg-gray-100 h-48 flex items-center justify-center text-gray-400">
              <span>No OG Image Selected</span>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">{domain}</div>
                <div className="text-xs text-blue-500">{twitterHandle}</div>
              </div>
              <div className="font-bold text-base mb-1 truncate">{title}</div>
              <div className="text-sm text-gray-600 line-clamp-2">{description}</div>
              <div className="mt-2 text-xs text-gray-500">
                {twitterCard === 'summary'
                  ? 'Twitter Summary Card'
                  : twitterCard === 'summary_large_image'
                    ? 'Twitter Large Image Card'
                    : twitterCard === 'player'
                      ? 'Twitter Player Card'
                      : 'Social Card'}
              </div>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            <span>Social media preview - how your content appears when shared</span>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
        <p>
          <strong>Tip:</strong> For best results, keep titles under 60 characters and descriptions
          under 160 characters. Social images should be at least 1200×630 pixels for optimal
          display.
        </p>
        <p className="mt-2 text-xs text-amber-500">
          <strong>Note:</strong> This is a static preview. In the admin panel, this will update as you type.
        </p>
      </div>
    </div>
  )
}

export default SimpleSEOPreview
