'use client'

// src/components/admin/BatchVideoUpload.tsx


import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { UploadCloudIcon, PlusIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react'

interface UploadResults {
  results: Array<{
    title: string
    success: boolean
    error?: string
  }>
  summary: {
    total: number
    successful: number
    failed: number
  }
}

const BatchVideoUpload = ({ categories }: { categories: Array<{ id: string; title: string }> }) => {
  const { toast } = useToast()
  const [videos, setVideos] = useState([
    {
      title: '',
      description: '',
      categoryId: '',
      tagIds: [],
      visibility: 'public',
    },
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [results, setResults] = useState<UploadResults | null>(null)

  const addVideo = () => {
    setVideos([
      ...videos,
      {
        title: '',
        description: '',
        categoryId: '',
        tagIds: [],
        visibility: 'public',
      },
    ])
  }

  const removeVideo = (index: number) => {
    const updatedVideos = [...videos]
    updatedVideos.splice(index, 1)
    setVideos(updatedVideos)
  }

  const updateVideo = (index: number, field: keyof (typeof videos)[0], value: string) => {
    const updatedVideos = [...videos]
    if (updatedVideos[index]) {
      updatedVideos[index] = {
        ...updatedVideos[index],
        [field]: value,
      }
    }
    setVideos(updatedVideos)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validate inputs
    const invalidVideos = videos.filter((video) => !video.title)
    if (invalidVideos.length > 0) {
      toast({
        title: 'Validation Error',
        description: 'All videos must have a title',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/videos/batch-upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videos }),
      })

      if (!response.ok) {
        throw new Error('Failed to process batch upload')
      }

      const data = await response.json()
      setResults(data)

      toast({
        title: 'Batch Upload Initiated',
        description: `${data.summary.successful} out of ${data.summary.total} videos were successfully created.`,
        variant: data.summary.failed > 0 ? 'destructive' : 'default',
      })

      // Reset form if all successful
      if (data.summary.failed === 0) {
        setVideos([
          {
            title: '',
            description: '',
            categoryId: '',
            tagIds: [],
            visibility: 'public',
          },
        ])
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Video Upload</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          {videos.map((video, index) => (
            <div key={index} className="p-4 border rounded-lg mb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Video #{index + 1}</h3>
                {videos.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVideo(index)}
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor={`title-${index}`}>Title</Label>
                  <Input
                    id={`title-${index}`}
                    value={video.title}
                    onChange={(e) => updateVideo(index, 'title', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor={`description-${index}`}>Description</Label>
                  <Textarea
                    id={`description-${index}`}
                    value={video.description}
                    onChange={(e) => updateVideo(index, 'description', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`category-${index}`}>Category</Label>
                    <Select
                      value={video.categoryId}
                      onValueChange={(value) => updateVideo(index, 'categoryId', value)}
                    >
                      <SelectTrigger id={`category-${index}`}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor={`visibility-${index}`}>Visibility</Label>
                    <Select
                      value={video.visibility}
                      onValueChange={(value) => updateVideo(index, 'visibility', value)}
                    >
                      <SelectTrigger id={`visibility-${index}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="members">Members Only</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {results?.results && (
                <div className="mt-4">
                  {results.results.find((r) => r.title === video.title) && (
                    <div
                      className={`p-2 rounded ${results.results.find((r) => r.title === video.title)?.success ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}
                    >
                      {results.results.find((r) => r.title === video.title)?.success ? (
                        <div className="flex items-center">
                          <CheckCircleIcon className="h-5 w-5 mr-2" />
                          <span>Created successfully</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <XCircleIcon className="h-5 w-5 mr-2" />
                          <span>{results.results.find((r) => r.title === video.title)?.error}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          <div className="flex items-center justify-between">
            <Button type="button" variant="outline" onClick={addVideo} disabled={isSubmitting}>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Another Video
            </Button>

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <UploadCloudIcon className="h-4 w-4 mr-2" />
                  Start Batch Upload
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

export default BatchVideoUpload
