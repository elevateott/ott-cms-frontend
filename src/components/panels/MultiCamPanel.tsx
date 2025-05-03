'use client'

import React from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { clientLogger } from '@/utils/clientLogger'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { basicSceneCollection, advancedSceneCollection } from '@/data/obsSceneCollections'

const logger = clientLogger.createContextLogger('MultiCamPanel')

export const MultiCamPanel: React.FC = () => {
  const { document } = useDocumentInfo()
  const { toast } = useToast()

  // Only show for multi-camera enabled events
  if (!document?.multiCamEnabled) {
    return null
  }

  const handleDownload = (type: 'basic' | 'advanced') => {
    try {
      logger.info('Downloading OBS Scene Collection', { type })
      
      // Get the appropriate scene collection based on type
      const sceneCollection = type === 'basic' ? basicSceneCollection : advancedSceneCollection
      
      // Add event-specific information
      const customizedCollection = {
        ...sceneCollection,
        name: `${document.title || 'Live Event'} - ${type === 'basic' ? 'Basic' : 'Advanced'} Multi-Cam Setup`,
        eventInfo: {
          title: document.title || 'Live Event',
          description: document.description || '',
          streamKey: document.muxStreamKey || '',
          rtmpUrl: 'rtmp://global-live.mux.com:5222/app',
        }
      }
      
      // Create and download the file
      const content = JSON.stringify(customizedCollection, null, 2)
      const blob = new Blob([content], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${document.title || 'stream'}-${type}-multicam-scenes.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // Show toast
      toast({
        title: 'OBS Scene Collection Downloaded',
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} multi-camera scene collection downloaded.`,
        duration: 3000,
      })
    } catch (error) {
      logger.error('Failed to download OBS Scene Collection', error)
      toast({
        title: 'Download failed',
        description: 'Failed to download OBS Scene Collection. Please try again.',
        variant: 'destructive',
        duration: 3000,
      })
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Multi-Camera Setup</CardTitle>
        <CardDescription>Advanced OBS configuration for multi-camera streaming</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <p className="text-sm">
            This event is configured for multi-camera streaming. Download a pre-configured OBS Scene Collection
            to quickly set up multiple camera angles and transitions for your broadcast.
          </p>

          <Tabs defaultValue="setup" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="setup">Setup Guide</TabsTrigger>
              <TabsTrigger value="scenes">Scene Layouts</TabsTrigger>
              <TabsTrigger value="hotkeys">Hotkeys</TabsTrigger>
            </TabsList>
            
            <TabsContent value="setup" className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Multi-Camera Setup Instructions</h4>
                <ol className="text-sm text-blue-700 space-y-2 list-decimal list-outside ml-4">
                  <li>Download one of the OBS Scene Collection templates below</li>
                  <li>Open OBS Studio and go to Scene Collection → Import</li>
                  <li>Select the downloaded JSON file</li>
                  <li>For each camera source in the scenes:
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>Right-click the source and select Properties</li>
                      <li>Select your camera from the Device dropdown</li>
                      <li>Adjust resolution and frame rate as needed</li>
                    </ul>
                  </li>
                  <li>Configure your stream settings with your Mux RTMP URL and Stream Key</li>
                  <li>Test switching between scenes using hotkeys or the OBS interface</li>
                </ol>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-green-800 mb-2">Basic Multi-Cam Setup</h4>
                  <p className="text-sm text-green-700 mb-4">
                    Includes 4 basic scenes: Camera 1, Camera 2, Picture-in-Picture, and Side-by-Side.
                    Perfect for beginners or simple two-camera setups.
                  </p>
                  <Button onClick={() => handleDownload('basic')} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download Basic Template
                  </Button>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-purple-800 mb-2">Advanced Multi-Cam Setup</h4>
                  <p className="text-sm text-purple-700 mb-4">
                    Includes 8 scenes with transitions, lower thirds, and multiple layout options.
                    Ideal for professional broadcasts with 3+ cameras.
                  </p>
                  <Button onClick={() => handleDownload('advanced')} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download Advanced Template
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="scenes" className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-amber-800 mb-2">Recommended Scene Layouts</h4>
                <ul className="text-sm text-amber-700 space-y-2 list-disc list-outside ml-4">
                  <li><strong>Camera 1 (Full Screen)</strong> - Primary camera covering the main action</li>
                  <li><strong>Camera 2 (Full Screen)</strong> - Secondary camera for alternate angles</li>
                  <li><strong>Picture-in-Picture</strong> - Main camera with smaller secondary camera overlay</li>
                  <li><strong>Side-by-Side Split</strong> - Equal space for two cameras</li>
                  <li><strong>Three Camera Grid</strong> - For setups with three or more cameras (Advanced template only)</li>
                  <li><strong>Lower Third Overlay</strong> - Text overlay for speaker information (Advanced template only)</li>
                  <li><strong>Opening/Closing Slate</strong> - Professional intro/outro screens (Advanced template only)</li>
                </ul>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-gray-800 mb-2">Customizing Scenes</h4>
                <p className="text-sm text-gray-700">
                  After importing the template, you can customize each scene by adding your own graphics, 
                  adjusting camera positions, or adding additional sources like screen sharing or media files.
                  The templates provide a starting point that you can adapt to your specific needs.
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="hotkeys" className="space-y-4">
              <div className="bg-indigo-50 border border-indigo-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-indigo-800 mb-2">Setting Up Hotkeys</h4>
                <p className="text-sm text-indigo-700 mb-2">
                  Hotkeys allow you to quickly switch between scenes during your broadcast:
                </p>
                <ol className="text-sm text-indigo-700 space-y-2 list-decimal list-outside ml-4">
                  <li>In OBS, go to Settings → Hotkeys</li>
                  <li>Find the "Switch to Scene" section for each of your scenes</li>
                  <li>Click the field next to each scene and press the key you want to assign</li>
                  <li>Recommended hotkeys:
                    <ul className="list-disc list-inside ml-4 mt-1">
                      <li>Camera 1: <kbd className="px-2 py-1 bg-indigo-100 rounded">1</kbd></li>
                      <li>Camera 2: <kbd className="px-2 py-1 bg-indigo-100 rounded">2</kbd></li>
                      <li>Picture-in-Picture: <kbd className="px-2 py-1 bg-indigo-100 rounded">3</kbd></li>
                      <li>Side-by-Side: <kbd className="px-2 py-1 bg-indigo-100 rounded">4</kbd></li>
                      <li>Additional scenes: <kbd className="px-2 py-1 bg-indigo-100 rounded">5</kbd>, <kbd className="px-2 py-1 bg-indigo-100 rounded">6</kbd>, etc.</li>
                    </ul>
                  </li>
                  <li>Click "Apply" then "OK" to save your hotkeys</li>
                </ol>
              </div>
              
              <div className="bg-rose-50 border border-rose-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-rose-800 mb-2">Recommended OBS Plugins</h4>
                <p className="text-sm text-rose-700 mb-2">
                  These optional plugins can enhance your multi-camera workflow:
                </p>
                <ul className="text-sm text-rose-700 space-y-2 list-disc list-outside ml-4">
                  <li><strong>Advanced Scene Switcher</strong> - Automate scene switching based on audio levels, window focus, etc.</li>
                  <li><strong>StreamFX</strong> - Additional visual effects and transitions</li>
                  <li><strong>Source Dock</strong> - Create a custom multiview layout</li>
                  <li><strong>Transition Table</strong> - Define specific transitions between each scene pair</li>
                </ul>
                <p className="text-sm text-rose-700 mt-2">
                  Install plugins from the <a href="https://obsproject.com/forum/resources/categories/obs-studio-plugins.6/" target="_blank" rel="noopener noreferrer" className="underline">OBS Forum</a> or using the OBS Plugin Installer.
                </p>
              </div>
            </TabsContent>
          </Tabs>

          {document.multiCamInstructions && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">Custom Instructions</h4>
              <div className="text-sm text-gray-700 prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: document.multiCamInstructions }} />
              </div>
            </div>
          )}
          
          <p className="text-xs text-gray-500 mt-2">
            Note: These scene collections are templates that you'll need to customize with your specific camera sources.
            OBS Scene Collections are imported via Scene Collection → Import in OBS Studio.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default MultiCamPanel
