'use client'

import React from 'react'
import { VideoStatusProvider } from '@/contexts/VideoStatusContext'
import VideoAdmin from '@/components/video/VideoAdmin'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Button } from '@/components/ui/button'
import { PlusCircle, EyeOff } from 'lucide-react'

// This component provides the video management UI above the list view
const VideoManagement: React.FC = () => {
  const [isOpen, setIsOpen] = useLocalStorage<boolean>('video-upload-open', false)

  const toggleLabel = isOpen ? (
    <>
      <EyeOff className="w-4 h-4 mr-2" />
      Hide New Video Panel
    </>
  ) : (
    <>
      <PlusCircle className="w-4 h-4 mr-2" />
      Add New Video
    </>
  )

  return (
    <VideoStatusProvider>
      <div className="p-6 w-full mb-10 bg-white dark:bg-black rounded-lg shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex justify-between items-center mb-4 border-b pb-2">
          <h2 className="text-xl font-bold">Video Asset Management</h2>
        </div>

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="flex justify-between items-center mb-4">
            <CollapsibleTrigger asChild>
              <Button variant="outline">{toggleLabel}</Button>
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent className="overflow-hidden transition-all duration-300 ease-in-out data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <div className="mb-8">
              <VideoAdmin className="w-full" />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </VideoStatusProvider>
  )
}

export default VideoManagement
