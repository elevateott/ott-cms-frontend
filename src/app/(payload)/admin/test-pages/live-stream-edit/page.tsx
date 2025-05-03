'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export default function LiveStreamEditTest() {
  const router = useRouter()
  const [liveEvents, setLiveEvents] = useState<any[]>([])
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [currentEvent, setCurrentEvent] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    playbackPolicy: 'public',
    isRecordingEnabled: false,
    simulcastTargets: [] as { name: string; url: string; streamKey: string }[],
  })

  // Fetch live events
  useEffect(() => {
    const fetchLiveEvents = async () => {
      try {
        const response = await fetch('/api/live-events')
        if (!response.ok) {
          throw new Error('Failed to fetch live events')
        }
        const data = await response.json()
        setLiveEvents(data.docs || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchLiveEvents()
  }, [])

  // Fetch selected event details
  useEffect(() => {
    if (selectedEvent) {
      const fetchEventDetails = async () => {
        try {
          setLoading(true)
          const response = await fetch(`/api/live-events/${selectedEvent}`)
          if (!response.ok) {
            throw new Error('Failed to fetch event details')
          }
          const data = await response.json()
          setCurrentEvent(data)
          setFormData({
            title: data.title || '',
            description: data.description || '',
            playbackPolicy: data.playbackPolicy || 'public',
            isRecordingEnabled: data.isRecordingEnabled || false,
            simulcastTargets: data.simulcastTargets || [],
          })
        } catch (err) {
          setError(err instanceof Error ? err.message : 'An unknown error occurred')
        } finally {
          setLoading(false)
        }
      }

      fetchEventDetails()
    }
  }, [selectedEvent])

  const handleSelectChange = (value: string) => {
    setSelectedEvent(value)
    setError(null)
    setSuccess(null)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, isRecordingEnabled: checked }))
  }

  const handleSelectPolicyChange = (value: string) => {
    setFormData((prev) => ({ ...prev, playbackPolicy: value }))
  }

  const handleAddSimulcastTarget = () => {
    setFormData((prev) => ({
      ...prev,
      simulcastTargets: [...prev.simulcastTargets, { name: '', url: '', streamKey: '' }],
    }))
  }

  const handleRemoveSimulcastTarget = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      simulcastTargets: prev.simulcastTargets.filter((_, i) => i !== index),
    }))
  }

  const handleSimulcastTargetChange = (index: number, field: string, value: string) => {
    setFormData((prev) => {
      const updatedTargets = [...prev.simulcastTargets]
      updatedTargets[index] = { ...updatedTargets[index], [field]: value }
      return { ...prev, simulcastTargets: updatedTargets }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEvent) return

    try {
      setLoading(true)
      setError(null)
      setSuccess(null)

      const response = await fetch(`/api/live-events/${selectedEvent}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update live event')
      }

      const updatedEvent = await response.json()
      setCurrentEvent(updatedEvent)
      setSuccess('Live event updated successfully!')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Live Stream Edit Test</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Success</AlertTitle>
          <AlertDescription className="text-green-700">{success}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select a Live Event</CardTitle>
          <CardDescription>Choose a live event to edit its settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedEvent || ''} onValueChange={handleSelectChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a live event" />
            </SelectTrigger>
            <SelectContent>
              {liveEvents.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {currentEvent && (
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Edit Live Event Settings</CardTitle>
              <CardDescription>
                Make changes to the live event settings. Changes will be synced with Mux.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter description"
                  rows={3}
                />
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <Label htmlFor="playbackPolicy">Playback Policy</Label>
                <Select value={formData.playbackPolicy} onValueChange={handleSelectPolicyChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select playback policy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="signed">Signed</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Public streams are accessible to anyone with the URL. Signed streams require a
                  signed token.
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="isRecordingEnabled"
                  checked={formData.isRecordingEnabled}
                  onCheckedChange={handleSwitchChange}
                />
                <Label htmlFor="isRecordingEnabled">Enable Recording</Label>
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-medium">Simulcast Targets</Label>
                  <Button
                    type="button"
                    onClick={handleAddSimulcastTarget}
                    size="sm"
                    variant="outline"
                  >
                    Add Target
                  </Button>
                </div>

                <p className="text-sm text-gray-500">
                  Add RTMP destinations to simulcast your live stream to other platforms.
                </p>

                {formData.simulcastTargets.length === 0 ? (
                  <div className="text-center py-6 border border-dashed rounded-md">
                    <p className="text-gray-500 mb-2">No simulcast targets added</p>
                    <Button type="button" onClick={handleAddSimulcastTarget} variant="outline">
                      Add Target
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {formData.simulcastTargets.map((target, index) => (
                      <Card key={index} className="border border-gray-200">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">
                              {target.name || `Target ${index + 1}`}
                            </CardTitle>
                            <Button
                              type="button"
                              onClick={() => handleRemoveSimulcastTarget(index)}
                              variant="ghost"
                              size="sm"
                              className="text-red-500"
                            >
                              Remove
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3 pb-4">
                          <div>
                            <Label htmlFor={`target-${index}-name`}>Name</Label>
                            <Input
                              id={`target-${index}-name`}
                              value={target.name}
                              onChange={(e) =>
                                handleSimulcastTargetChange(index, 'name', e.target.value)
                              }
                              placeholder="e.g., YouTube, Facebook"
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`target-${index}-url`}>RTMP URL</Label>
                            <Input
                              id={`target-${index}-url`}
                              value={target.url}
                              onChange={(e) =>
                                handleSimulcastTargetChange(index, 'url', e.target.value)
                              }
                              placeholder="rtmp://..."
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`target-${index}-streamKey`}>Stream Key</Label>
                            <Input
                              id={`target-${index}-streamKey`}
                              type="password"
                              value={target.streamKey}
                              onChange={(e) =>
                                handleSimulcastTargetChange(index, 'streamKey', e.target.value)
                              }
                              placeholder="Stream key"
                              className="mt-1"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
        </form>
      )}

      {currentEvent && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Current Live Stream Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold">Mux Stream ID:</p>
                <p className="text-sm font-mono">{currentEvent.muxLiveStreamId}</p>
              </div>
              <div>
                <p className="font-semibold">Status:</p>
                <p className="text-sm">{currentEvent.muxStatus}</p>
              </div>
              <div>
                <p className="font-semibold">Recording Enabled:</p>
                <p className="text-sm">{currentEvent.isRecordingEnabled ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="font-semibold">Playback Policy:</p>
                <p className="text-sm">{currentEvent.playbackPolicy || 'public'}</p>
              </div>
              <div className="col-span-2 mt-2">
                <p className="font-semibold">Simulcast Targets:</p>
                {currentEvent.simulcastTargets && currentEvent.simulcastTargets.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {currentEvent.simulcastTargets.map((target: any, index: number) => (
                      <div key={index} className="text-sm border rounded p-2">
                        <p>
                          <span className="font-medium">{target.name}</span> ({target.url})
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">No simulcast targets configured</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
