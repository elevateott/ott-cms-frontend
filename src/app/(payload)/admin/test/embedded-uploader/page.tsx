'use client'

import React from 'react'
import EmbeddedVideoUploader from '@/components/video/EmbeddedVideoUploader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestEmbeddedUploaderPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Test Embedded HLS Uploader</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Embedded HLS Video Uploader</CardTitle>
          <CardDescription>
            Test the embedded HLS video uploader component. Enter a valid .m3u8 URL to create a new video asset.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmbeddedVideoUploader 
            onUploadComplete={(data) => {
              console.log('Upload complete:', data)
              alert(`Video created successfully!\nID: ${data.id}\nTitle: ${data.title}`)
            }}
          />
        </CardContent>
      </Card>
      
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4">Test URLs</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <code className="bg-gray-100 p-1 rounded">https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8</code> - 
            Valid Mux test stream
          </li>
          <li>
            <code className="bg-gray-100 p-1 rounded">https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8</code> - 
            Valid Unified Streaming test stream
          </li>
        </ul>
      </div>
    </div>
  )
}
