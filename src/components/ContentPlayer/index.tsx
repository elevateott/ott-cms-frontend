'use client'

import React, { useState } from 'react'
import { VideoPlayer } from '@/components/VideoPlayer'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import { formatDistanceToNow } from 'date-fns'
import { formatDuration } from '@/utils/dateTime'

type VideoAsset = {
  id: string
  title: string
  sourceType: 'mux' | 'embedded'
  muxData?: {
    playbackId?: string
    status?: string
  }
  embeddedUrl?: string
  duration?: number
  aspectRatio?: string
  muxThumbnailUrl?: string
  thumbnail?: {
    url: string
    alt?: string
  }
}

type TrailerItem = {
  video: VideoAsset
  title?: string
  description?: string
}

type BonusContentItem = {
  video: VideoAsset
  title: string
  description?: string
  type: 'behind-the-scenes' | 'interview' | 'deleted-scene' | 'commentary' | 'other'
}

type ContentPlayerProps = {
  content: {
    id: string
    title: string
    description?: string
    mainVideo: VideoAsset
    trailers?: TrailerItem[]
    bonusContent?: BonusContentItem[]
    posterImage?: {
      url: string
      alt?: string
    }
    releaseDate?: string
    category?: {
      title: string
    }
  }
  className?: string
}

export const ContentPlayer: React.FC<ContentPlayerProps> = ({ content, className = '' }) => {
  const [activeVideo, setActiveVideo] = useState<VideoAsset>(
    content.mainVideo || { id: '', title: '', sourceType: 'mux' },
  )
  const [activeTab, setActiveTab] = useState('main')

  if (!content) return null

  const hasTrailers = content.trailers && content.trailers.length > 0
  const hasBonusContent = content.bonusContent && content.bonusContent.length > 0

  const handleTrailerClick = (trailer: TrailerItem) => {
    setActiveVideo(trailer.video)
    setActiveTab('trailers')
  }

  const handleBonusContentClick = (bonusItem: BonusContentItem) => {
    setActiveVideo(bonusItem.video)
    setActiveTab('bonus')
  }

  const handleMainVideoClick = () => {
    setActiveVideo(content.mainVideo)
    setActiveTab('main')
  }

  return (
    <div className={`content-player ${className}`}>
      <div className="aspect-video mb-6 rounded-lg overflow-hidden">
        <VideoPlayer video={activeVideo} />
      </div>

      <Tabs defaultValue="main" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="main">Main</TabsTrigger>
          {hasTrailers && <TabsTrigger value="trailers">Trailers</TabsTrigger>}
          {hasBonusContent && <TabsTrigger value="bonus">Bonus Content</TabsTrigger>}
        </TabsList>

        <TabsContent value="main" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>{content.title}</CardTitle>
              {content.releaseDate && (
                <CardDescription>
                  Released {formatDistanceToNow(new Date(content.releaseDate), { addSuffix: true })}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">{content.description}</p>
              {content.category && (
                <div className="mt-4">
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-sm">
                    {content.category.title}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {hasTrailers && (
          <TabsContent value="trailers" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {content.trailers.map((trailer, index) => (
                <Card
                  key={`trailer-${index}`}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    activeVideo.id === trailer.video.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleTrailerClick(trailer)}
                >
                  <div className="aspect-video relative">
                    <Image
                      src={
                        trailer.video.thumbnail?.url ||
                        trailer.video.muxThumbnailUrl ||
                        '/placeholder-video.jpg'
                      }
                      alt={trailer.title || trailer.video.title}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 rounded-full bg-primary/80 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="white"
                          className="w-8 h-8"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {trailer.title || trailer.video.title}
                    </CardTitle>
                  </CardHeader>
                  {trailer.description && (
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {trailer.description}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>
        )}

        {hasBonusContent && (
          <TabsContent value="bonus" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {content.bonusContent.map((bonusItem, index) => (
                <Card
                  key={`bonus-${index}`}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${
                    activeVideo.id === bonusItem.video.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleBonusContentClick(bonusItem)}
                >
                  <div className="aspect-video relative">
                    <Image
                      src={
                        bonusItem.video.thumbnail?.url ||
                        bonusItem.video.muxThumbnailUrl ||
                        '/placeholder-video.jpg'
                      }
                      alt={bonusItem.title}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 rounded-full bg-primary/80 flex items-center justify-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          fill="white"
                          className="w-8 h-8"
                        >
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      {bonusItem.type.replace(/-/g, ' ')}
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">{bonusItem.title}</CardTitle>
                  </CardHeader>
                  {bonusItem.description && (
                    <CardContent>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {bonusItem.description}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

export default ContentPlayer
