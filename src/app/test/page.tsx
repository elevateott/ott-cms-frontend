'use client'

import React from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TestIndexPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">OTT CMS Test Tools</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Video Asset Creator</CardTitle>
            <CardDescription>
              Test creating video assets using the VideoAssetRepository
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              This tool allows you to create new video assets directly using the VideoAssetRepository.
              You can specify a title, Mux Asset ID, and Playback ID.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/test/videoasset">Open Tool</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
