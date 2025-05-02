'use client'

import React, { useState, useEffect } from 'react'
import { useDocumentInfo } from '@payloadcms/ui'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Trash2, Plus, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { clientLogger } from '@/utils/clientLogger'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'

const logger = clientLogger.createContextLogger('SimulcastTargetsPanel')

type SimulcastTarget = {
  id?: string
  name: string
  url: string
  streamKey: string
  status?: 'connected' | 'disconnected' | 'error'
}

export const SimulcastTargetsPanel: React.FC = () => {
  const { id, document } = useDocumentInfo()
  const { toast } = useToast()
  
  const [simulcastTargets, setSimulcastTargets] = useState<SimulcastTarget[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newTarget, setNewTarget] = useState<SimulcastTarget>({ name: '', url: '', streamKey: '' })
  const [showStreamKey, setShowStreamKey] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Get the Mux live stream ID
  const muxLiveStreamId = document?.muxLiveStreamId
  const muxStatus = document?.muxStatus
  const useExternalHlsUrl = document?.useExternalHlsUrl

  // Load simulcast targets from document
  useEffect(() => {
    if (document?.simulcastTargets) {
      setSimulcastTargets(document.simulcastTargets || [])
    }
  }, [document])

  // Refresh simulcast targets every 15 seconds if the stream is active
  useEffect(() => {
    if (!muxLiveStreamId || !['active', 'idle'].includes(muxStatus)) {
      return
    }

    const interval = setInterval(() => {
      handleRefresh()
    }, 15000)

    return () => clearInterval(interval)
  }, [muxLiveStreamId, muxStatus])

  // If using external HLS URL, don't show the panel
  if (useExternalHlsUrl) {
    return null
  }

  // Handle adding a new simulcast target
  const handleAddTarget = async () => {
    try {
      setIsSubmitting(true)
      
      // Validate inputs
      if (!newTarget.name || !newTarget.url || !newTarget.streamKey) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all fields',
          variant: 'destructive',
        })
        return
      }

      if (!newTarget.url.startsWith('rtmp://')) {
        toast({
          title: 'Validation Error',
          description: 'RTMP URL must start with rtmp://',
          variant: 'destructive',
        })
        return
      }

      logger.info('Adding new simulcast target', { name: newTarget.name, url: newTarget.url })

      // Call the API to add the simulcast target
      const response = await fetch(`/api/live-events/${id}/simulcast-targets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTarget),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to add simulcast target')
      }

      const result = await response.json()

      // Add the new target to the list
      setSimulcastTargets([...simulcastTargets, result.simulcastTarget])

      // Reset the form
      setNewTarget({ name: '', url: '', streamKey: '' })
      setIsDialogOpen(false)

      // Show success toast
      toast({
        title: 'Success',
        description: 'Simulcast target added successfully',
      })
    } catch (error) {
      logger.error('Failed to add simulcast target', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to add simulcast target',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle removing a simulcast target
  const handleRemoveTarget = async (targetId: string) => {
    try {
      setIsLoading(true)
      logger.info('Removing simulcast target', { targetId })

      // Call the API to remove the simulcast target
      const response = await fetch(`/api/live-events/${id}/simulcast-targets/${targetId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to remove simulcast target')
      }

      // Remove the target from the list
      setSimulcastTargets(simulcastTargets.filter(target => target.id !== targetId))

      // Show success toast
      toast({
        title: 'Success',
        description: 'Simulcast target removed successfully',
      })
    } catch (error) {
      logger.error('Failed to remove simulcast target', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to remove simulcast target',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle refreshing simulcast targets
  const handleRefresh = async () => {
    try {
      if (isRefreshing) return
      
      setIsRefreshing(true)
      logger.info('Refreshing simulcast targets')

      // Call the API to get the latest simulcast targets
      const response = await fetch(`/api/live-events/${id}/simulcast-targets`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to refresh simulcast targets')
      }

      const result = await response.json()

      // Update the list
      setSimulcastTargets(result.simulcastTargets || [])
    } catch (error) {
      logger.error('Failed to refresh simulcast targets', error)
      // Don't show a toast for background refreshes to avoid spamming the user
    } finally {
      setIsRefreshing(false)
    }
  }

  // Get status badge color
  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500 hover:bg-green-600'
      case 'disconnected':
        return 'bg-yellow-500 hover:bg-yellow-600'
      case 'error':
        return 'bg-red-500 hover:bg-red-600'
      default:
        return 'bg-gray-500 hover:bg-gray-600'
    }
  }

  // Render the panel
  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Simulcast Targets</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Refresh simulcast targets"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  Add Target
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Simulcast Target</DialogTitle>
                  <DialogDescription>
                    Add a new destination to simulcast your live stream to.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., YouTube, Facebook, Twitch"
                      value={newTarget.name}
                      onChange={(e) => setNewTarget({ ...newTarget, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url">RTMP URL</Label>
                    <Input
                      id="url"
                      placeholder="rtmp://..."
                      value={newTarget.url}
                      onChange={(e) => setNewTarget({ ...newTarget, url: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="streamKey">Stream Key</Label>
                    <div className="relative">
                      <Input
                        id="streamKey"
                        type={showStreamKey ? 'text' : 'password'}
                        placeholder="Stream key"
                        value={newTarget.streamKey}
                        onChange={(e) => setNewTarget({ ...newTarget, streamKey: e.target.value })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 transform -translate-y-1/2"
                        onClick={() => setShowStreamKey(!showStreamKey)}
                      >
                        {showStreamKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddTarget} disabled={isSubmitting}>
                    {isSubmitting ? 'Adding...' : 'Add Target'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <CardDescription>
          Simulcast your live stream to multiple platforms simultaneously.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {simulcastTargets.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-md">
            <p className="text-gray-500">No simulcast targets added yet</p>
            <Button 
              onClick={() => setIsDialogOpen(true)}
              variant="outline" 
              className="mt-2"
            >
              Add Your First Target
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {simulcastTargets.map((target, index) => (
              <Card key={target.id || index} className="border border-gray-200">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base">{target.name}</CardTitle>
                      <Badge className={getStatusColor(target.status)}>
                        {target.status || 'Unknown'}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => target.id && handleRemoveTarget(target.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">RTMP URL:</span> {target.url}
                  </div>
                  <div>
                    <span className="font-medium">Stream Key:</span> ••••••••••••••••
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {muxStatus === 'active' && simulcastTargets.length > 0 && (
          <Alert className="mt-4">
            <AlertDescription>
              <strong>Note:</strong> Changes to simulcast targets while a stream is active may require you to restart your streaming software.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}

export default SimulcastTargetsPanel
