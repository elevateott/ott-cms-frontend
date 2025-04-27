'use client'

import React, { useState, useEffect } from 'react'
import { useField, useDocumentInfo } from '@payloadcms/ui'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Upload, X, AlertCircle, CheckCircle } from 'lucide-react'
import { clientLogger } from '@/utils/clientLogger'
import { useToast } from '@/components/ui/use-toast'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface SubtitleUploaderProps {
  path: string
}

interface SubtitleTrack {
  id: string
  language: string
  name?: string
  kind?: 'subtitles' | 'captions' | 'descriptions'
  closedCaptions?: boolean
  muxTrackId?: string
  url?: string
}

const SubtitleUploader: React.FC<SubtitleUploaderProps> = ({ path }) => {
  const { toast } = useToast()
  const { value, setValue } = useField<any>({ path: 'subtitles.tracks' })
  const { value: muxData } = useField<any>({ path: 'muxData' })
  const { id: documentId } = useDocumentInfo()

  const [isLoading, setIsLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [language, setLanguage] = useState('en')
  const [name, setName] = useState('')
  const [kind, setKind] = useState<'subtitles' | 'captions' | 'descriptions'>('subtitles')
  const [closedCaptions, setClosedCaptions] = useState(false)
  const [tracks, setTracks] = useState<SubtitleTrack[]>([])
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false)

  // Load tracks from Mux when component mounts
  useEffect(() => {
    if (muxData?.assetId) {
      fetchTracks()
    }
  }, [muxData?.assetId])

  // Update local tracks state when value changes
  useEffect(() => {
    if (value) {
      setTracks(value)
    }
  }, [value])

  const fetchTracks = async () => {
    if (!muxData?.assetId) return

    try {
      const response = await fetch(`/api/mux/subtitles?assetId=${muxData.assetId}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch tracks: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      if (data.success && data.data) {
        // Map Mux tracks to our format if needed
        clientLogger.info('Fetched subtitle tracks:', data.data, 'SubtitleUploader')
      }
    } catch (error) {
      clientLogger.error('Error fetching subtitle tracks:', error, 'SubtitleUploader')
      toast({
        title: 'Error',
        description: 'Failed to fetch subtitle tracks',
        variant: 'destructive',
      })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      
      // Validate file type
      const validTypes = ['.vtt', '.srt', 'text/vtt', 'application/x-subrip']
      const fileType = selectedFile.type
      const fileName = selectedFile.name
      const fileExtension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase()
      
      if (!validTypes.some(type => 
        fileType.includes(type) || fileExtension.includes(type)
      )) {
        toast({
          title: 'Invalid file type',
          description: 'Only .vtt and .srt files are supported',
          variant: 'destructive',
        })
        return
      }
      
      setFile(selectedFile)
      
      // Set name based on file name if not already set
      if (!name) {
        const baseName = fileName.substring(0, fileName.lastIndexOf('.'))
        setName(baseName)
      }
    }
  }

  const handleUpload = async () => {
    if (!file || !muxData?.assetId) {
      toast({
        title: 'Error',
        description: 'File and asset ID are required',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      // Step 1: Upload the subtitle file
      const formData = new FormData()
      formData.append('file', file)

      const uploadResponse = await fetch('/api/mux/subtitle-upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error(`Failed to upload file: ${uploadResponse.status} ${uploadResponse.statusText}`)
      }

      const uploadData = await uploadResponse.json()
      if (!uploadData.success || !uploadData.data.url) {
        throw new Error('Failed to get upload URL')
      }

      const fileUrl = uploadData.data.url

      // Step 2: Create the subtitle track in Mux
      const createResponse = await fetch('/api/mux/subtitles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetId: muxData.assetId,
          language,
          name: name || language,
          kind,
          closedCaptions,
          fileUrl,
        }),
      })

      if (!createResponse.ok) {
        throw new Error(`Failed to create subtitle track: ${createResponse.status} ${createResponse.statusText}`)
      }

      const createData = await createResponse.json()
      if (!createData.success) {
        throw new Error('Failed to create subtitle track')
      }

      // Step 3: Add the track to the document
      const newTrack: SubtitleTrack = {
        id: Date.now().toString(), // Local ID for the array
        language,
        name: name || language,
        kind,
        closedCaptions,
        muxTrackId: createData.data.id,
        url: fileUrl,
      }

      const updatedTracks = [...(value || []), newTrack]
      setValue(updatedTracks)
      setTracks(updatedTracks)

      // Reset form
      setFile(null)
      setName('')
      setLanguage('en')
      setKind('subtitles')
      setClosedCaptions(false)

      toast({
        title: 'Success',
        description: 'Subtitle track added successfully',
      })
    } catch (error) {
      clientLogger.error('Error uploading subtitle:', error, 'SubtitleUploader')
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to upload subtitle',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (track: SubtitleTrack) => {
    if (!muxData?.assetId || !track.muxTrackId) return

    setIsDeleting(track.id)

    try {
      const response = await fetch(`/api/mux/subtitles/${track.muxTrackId}?assetId=${muxData.assetId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Failed to delete track: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error('Failed to delete subtitle track')
      }

      // Remove the track from the document
      const updatedTracks = (value || []).filter((t: SubtitleTrack) => t.id !== track.id)
      setValue(updatedTracks)
      setTracks(updatedTracks)

      toast({
        title: 'Success',
        description: 'Subtitle track deleted successfully',
      })
    } catch (error) {
      clientLogger.error('Error deleting subtitle track:', error, 'SubtitleUploader')
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete subtitle track',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const handleGenerateAutoCaptions = async () => {
    if (!muxData?.assetId) return

    setIsGeneratingCaptions(true)

    try {
      const response = await fetch('/api/mux/auto-captions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assetId: muxData.assetId,
          language: 'en', // Default to English
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to generate captions: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error('Failed to generate auto-captions')
      }

      toast({
        title: 'Success',
        description: 'Auto-caption generation initiated. This may take a few minutes to complete.',
      })
    } catch (error) {
      clientLogger.error('Error generating auto-captions:', error, 'SubtitleUploader')
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate auto-captions',
        variant: 'destructive',
      })
    } finally {
      setIsGeneratingCaptions(false)
    }
  }

  // If no Mux asset ID, don't render the component
  if (!muxData?.assetId || muxData?.status !== 'ready') {
    return (
      <div className="p-4 border rounded-md bg-gray-50">
        <div className="flex items-center text-gray-500">
          <AlertCircle className="w-5 h-5 mr-2" />
          <p>Subtitle management is only available for ready Mux videos.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Subtitle Track</CardTitle>
          <CardDescription>
            Upload subtitle files (.vtt or .srt) to add captions to your video
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subtitle-file">Subtitle File</Label>
            <Input
              id="subtitle-file"
              type="file"
              accept=".vtt,.srt"
              onChange={handleFileChange}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">Supported formats: VTT, SRT</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language Code</Label>
              <Input
                id="language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="en"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">e.g., en, es, fr</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="English"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">e.g., English, Spanish</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="kind">Kind</Label>
              <Select
                value={kind}
                onValueChange={(value) => setKind(value as 'subtitles' | 'captions' | 'descriptions')}
                disabled={isLoading}
              >
                <SelectTrigger id="kind">
                  <SelectValue placeholder="Select kind" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subtitles">Subtitles</SelectItem>
                  <SelectItem value="captions">Captions</SelectItem>
                  <SelectItem value="descriptions">Descriptions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 pt-8">
              <Checkbox
                id="closed-captions"
                checked={closedCaptions}
                onCheckedChange={(checked) => setClosedCaptions(checked === true)}
                disabled={isLoading}
              />
              <Label htmlFor="closed-captions">Closed Captions</Label>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              setFile(null)
              setName('')
              setLanguage('en')
              setKind('subtitles')
              setClosedCaptions(false)
            }}
            disabled={isLoading}
          >
            Reset
          </Button>
          <Button onClick={handleUpload} disabled={!file || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Subtitle
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Auto-Generate Captions</CardTitle>
          <CardDescription>
            Use Mux's automatic caption generation for English captions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Mux can automatically generate captions for your video. This process may take a few minutes to complete.
          </p>
        </CardContent>
        <CardFooter>
          <Button 
            onClick={handleGenerateAutoCaptions} 
            disabled={isGeneratingCaptions}
            variant="secondary"
          >
            {isGeneratingCaptions ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Generate Auto-Captions
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subtitle Tracks</CardTitle>
          <CardDescription>
            Manage existing subtitle tracks for this video
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tracks && tracks.length > 0 ? (
            <div className="space-y-4">
              {tracks.map((track) => (
                <div key={track.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex flex-col">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{track.name || track.language}</span>
                      <Badge variant="outline">{track.language}</Badge>
                      <Badge variant="secondary">{track.kind || 'subtitles'}</Badge>
                      {track.closedCaptions && <Badge>CC</Badge>}
                    </div>
                    <span className="text-xs text-gray-500 mt-1">
                      {track.muxTrackId ? `Track ID: ${track.muxTrackId}` : 'Pending'}
                    </span>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(track)}
                    disabled={isDeleting === track.id}
                  >
                    {isDeleting === track.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>No subtitle tracks added yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default SubtitleUploader
